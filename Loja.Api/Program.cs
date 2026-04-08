using System.Data.Common;
using FluentValidation;
using Loja.Api.Middleware;
using Loja.Application.Contracts.Products;
using Loja.Application.Services;
using Loja.Application.Validators.Products;
using Loja.Domain.Repositories;
using Loja.Infrastructure.Data;
using Loja.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

const string FrontendCorsPolicy = "FrontendCorsPolicy";

builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext());

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddDbContext<LojaDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=loja.db";

    options.UseSqlite(connectionString);
});

builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IProductService, ProductService>();

builder.Services.AddScoped<IValidator<CreateProductRequest>, CreateProductRequestValidator>();
builder.Services.AddScoped<IValidator<UpdateProductRequest>, UpdateProductRequestValidator>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseSerilogRequestLogging();
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseHttpsRedirection();
app.UseCors(FrontendCorsPolicy);

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<LojaDbContext>();
    var startupLogger = scope.ServiceProvider
        .GetRequiredService<ILoggerFactory>()
        .CreateLogger("DatabaseStartup");

    await EnsureLegacyDatabaseMigrationBaselineAsync(dbContext, startupLogger);
    await dbContext.Database.MigrateAsync();
}

app.Run();

static async Task EnsureLegacyDatabaseMigrationBaselineAsync(
    LojaDbContext dbContext,
    Microsoft.Extensions.Logging.ILogger logger)
{
    if (!dbContext.Database.IsSqlite())
    {
        return;
    }

    var availableMigrations = dbContext.Database.GetMigrations().ToArray();

    if (availableMigrations.Length == 0)
    {
        return;
    }

    var appliedMigrations = dbContext.Database.GetAppliedMigrations().ToArray();

    if (appliedMigrations.Length > 0)
    {
        return;
    }

    await using var connection = dbContext.Database.GetDbConnection();
    await connection.OpenAsync();

    var productsTableExists = await TableExistsAsync(connection, "Products");

    if (!productsTableExists)
    {
        return;
    }

    await EnsureMigrationsHistoryTableAsync(connection);

    var initialMigrationId = availableMigrations[0];
    var baselineMigrationAlreadyRecorded = await MigrationExistsInHistoryAsync(connection, initialMigrationId);

    if (baselineMigrationAlreadyRecorded)
    {
        return;
    }

    await using var insertCommand = connection.CreateCommand();
    insertCommand.CommandText = """
        INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
        VALUES ($migrationId, $productVersion);
        """;

    var migrationIdParameter = insertCommand.CreateParameter();
    migrationIdParameter.ParameterName = "$migrationId";
    migrationIdParameter.Value = initialMigrationId;
    insertCommand.Parameters.Add(migrationIdParameter);

    var productVersionParameter = insertCommand.CreateParameter();
    productVersionParameter.ParameterName = "$productVersion";
    productVersionParameter.Value = "8.0.13";
    insertCommand.Parameters.Add(productVersionParameter);

    await insertCommand.ExecuteNonQueryAsync();

    logger.LogInformation(
        "Seeded EF migration history with baseline migration {MigrationId} for an existing SQLite database.",
        initialMigrationId);
}

static async Task<bool> TableExistsAsync(DbConnection connection, string tableName)
{
    await using var command = connection.CreateCommand();
    command.CommandText = """
        SELECT COUNT(*)
        FROM sqlite_master
        WHERE type = 'table' AND name = $tableName;
        """;

    var tableNameParameter = command.CreateParameter();
    tableNameParameter.ParameterName = "$tableName";
    tableNameParameter.Value = tableName;
    command.Parameters.Add(tableNameParameter);

    var scalarResult = await command.ExecuteScalarAsync();
    return Convert.ToInt32(scalarResult) > 0;
}

static async Task EnsureMigrationsHistoryTableAsync(DbConnection connection)
{
    await using var command = connection.CreateCommand();
    command.CommandText = """
        CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
            "MigrationId" TEXT NOT NULL CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY,
            "ProductVersion" TEXT NOT NULL
        );
        """;

    await command.ExecuteNonQueryAsync();
}

static async Task<bool> MigrationExistsInHistoryAsync(DbConnection connection, string migrationId)
{
    await using var command = connection.CreateCommand();
    command.CommandText = """
        SELECT COUNT(*)
        FROM "__EFMigrationsHistory"
        WHERE "MigrationId" = $migrationId;
        """;

    var migrationIdParameter = command.CreateParameter();
    migrationIdParameter.ParameterName = "$migrationId";
    migrationIdParameter.Value = migrationId;
    command.Parameters.Add(migrationIdParameter);

    var scalarResult = await command.ExecuteScalarAsync();
    return Convert.ToInt32(scalarResult) > 0;
}

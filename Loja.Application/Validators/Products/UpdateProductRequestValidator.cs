using FluentValidation;
using Loja.Application.Contracts.Products;
using Loja.Domain.Constants;

namespace Loja.Application.Validators.Products;

public sealed class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequest>
{
    public UpdateProductRequestValidator()
    {
        RuleFor(x => x.Sku)
            .NotEmpty().WithMessage("O SKU deve ser informado.")
            .Length(3, 64).WithMessage("O SKU deve ter entre 3 e 64 caracteres.")
            .Matches("^[a-zA-Z0-9-]+$").WithMessage("O SKU deve conter apenas letras, numeros e hifen.");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("O nome do produto deve ser informado.")
            .MaximumLength(120).WithMessage("O nome do produto deve ter no maximo 120 caracteres.");

        RuleFor(x => x.Category)
            .NotEmpty().WithMessage("A categoria deve ser informada.")
            .MaximumLength(50).WithMessage("A categoria deve ter no maximo 50 caracteres.");

        RuleFor(x => x.StockQuantity)
            .GreaterThanOrEqualTo(0).WithMessage("O estoque nao pode ser negativo.");

        RuleFor(x => x.Price)
            .GreaterThanOrEqualTo(0).WithMessage("O preco nao pode ser negativo.");

        RuleFor(x => x)
            .Must(BeValidElectronicPrice)
            .WithMessage("Produtos da categoria ELETRONICO devem ter preco minimo de 50.00.")
            .WithName(nameof(UpdateProductRequest.Price));
    }

    private static bool BeValidElectronicPrice(UpdateProductRequest request)
    {
        var normalizedCategory = request.Category.Trim().ToUpperInvariant();

        if (normalizedCategory != ProductCategories.Electronic)
        {
            return true;
        }

        return request.Price >= 50m;
    }
}

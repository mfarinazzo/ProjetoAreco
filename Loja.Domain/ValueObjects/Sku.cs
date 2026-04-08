using System.Text.RegularExpressions;
using Loja.Domain.Common;

namespace Loja.Domain.ValueObjects;

public readonly partial record struct Sku
{
    public string Value { get; }

    private Sku(string value)
    {
        Value = value;
    }

    public static Sku Parse(string sku)
    {
        if (string.IsNullOrWhiteSpace(sku))
        {
            throw new DomainException("O SKU deve ser informado.");
        }

        var normalized = sku.Trim().ToUpperInvariant();

        if (normalized.Length is < 3 or > 64)
        {
            throw new DomainException("O SKU deve ter entre 3 e 64 caracteres.");
        }

        if (!SkuRegex().IsMatch(normalized))
        {
            throw new DomainException("O SKU deve conter apenas letras, numeros e hifen.");
        }

        return new Sku(normalized);
    }

    public override string ToString() => Value;

    [GeneratedRegex("^[A-Z0-9-]+$")]
    private static partial Regex SkuRegex();
}

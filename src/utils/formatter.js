export const formatCurrency = (value) => {
    const numberValue = Number(value);
    if (isNaN(numberValue)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(numberValue);
};

export const parseBrazilianCurrency = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string') return 0;
    const numberString = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(numberString) || 0;
};

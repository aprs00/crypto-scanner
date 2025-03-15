const formatNumber = (number: number, options: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat('en-US', options).format(number);

export { formatNumber };


export const shorten = (val, mfd = 2) => {
    if (val < 1000000) {
        return val.toLocaleString(undefined, { maximumFractionDigits: mfd });
    }
    const units = [
        ' Million',
        ' Billion',
        ' Trillion',
        ' Quadrillion',
        ' Quintillion',
        ' Sextillion',
        ' Septillion',
        ' Octillion',
        ' Nonillion',
        ' Decillion'
    ];
    let order = Math.floor(Math.log10(val) / 3);
    let unitname = units[order - 2];
    let num = val / Math.pow(10, order * 3);

    // If num is less than 1 (e.g., 999,999 is technically order 1.99), 
    // adjust to the previous unit to keep it >= 1
    if (num < 1 && order > 2) {
        order--;
        unitname = units[order - 2];
        num = val / Math.pow(10, order * 3);
    }

    return num.toLocaleString(undefined, { maximumFractionDigits: mfd }) + unitname;
}

export const shortenExponential = (val, mfd = 3) => {
    if (val < 10000) {
        return val.toLocaleString(undefined, { maximumFractionDigits: mfd });
    }
    return (val - 10 ** Math.floor(Math.log10(val) - mfd)).toExponential(mfd);
}

export const toTime = (ticks) => {
    if (ticks === Infinity) {
        return Infinity;
    }
    let result = '';
    let days = Math.floor(ticks / 50 / 60 / 60 / 24);
    ticks -= days * 24 * 60 * 60 * 50;
    let hours = Math.floor(ticks / 50 / 60 / 60);
    ticks -= hours * 60 * 60 * 50;
    let mins = Math.floor(ticks / 50 / 60);
    ticks -= mins * 60 * 50
    if (days >= 100) {
        return shorten(days, 0) + ' days';
    }
    if (days > 0) {
        result += days + 'd ';
    }
    if (days > 0 || hours > 0) {
        result += hours + 'h ';
    }
    if (days > 0 || hours > 0 || mins > 0) {
        result += mins + 'm ';
    }
    result += shortenExponential(ticks / 50, 1) + 's'
    return result;
}

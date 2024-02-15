const CSSBracesFix =(str) =>{
    const open = (str.match(/{/g) || []).length;
    const close = (str.match(/}/g) || []).length;
    const difference = open - close;
    if(difference > 0){
        // add more close braces
        str += '}'.repeat(difference);
    }else if(difference < 0){
        // TODO more open braces, would this happen?
    }
    return str;
}

const extractFontSizeOutOfMatchArray =(match) => {
    if(match === null){
        return;
    }
    if(match.length > 0){
        if(match[0].includes('.')){return parseFloat(match[0]);}
        else{return parseInt(match[0]);}
    }
}

const splitAndReplace =(str, regex, sub) =>{
    const arr = regex.exec(str);
    if(arr !== null && arr[0] !== ''){
        const splitIndex1 = arr.index;
        const splitIndex2 = arr.index + arr[0].length;
        const split1 = str.substring(0, splitIndex1);
        const split2 = str.substring(splitIndex2);
        str = split1 + sub + split2;
    }
    return str;
}

let myQueryHelper = (elem, query, results) => {
    if (elem.className.toString().indexOf(query) >= 0) {
        results.push(elem);
    }
    for (let child = elem.firstElementChild; child; child = child.nextElementSibling) {
        myQueryHelper(child, query, results);
    }
};

let myQuery = (elem, query) => {
    let results = [];
    myQueryHelper(elem, query, results);
    return results[0] || null;
};

let myQueryAll = (elem, query) => {
    let results = [];
    myQueryHelper(elem, query, results);
    return results;
};


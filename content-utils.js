// This file should be included in manifest.json, placed ahead of its caller js

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


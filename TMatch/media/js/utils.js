function sort_unique(arr)
    {
    arr = arr.sort();
    var ret = [arr[0]];
    for (var i = 1; i < arr.length; i++)
        {
        if (arr[i-1] !== arr[i])
            ret.push(arr[i]);
        }
    return ret;
    }

// retourne le code ISO de la langue du navigateur
function obtenirCodeLangueNavig()
    {
    var lct="en";
    if (navigator.language)
        {
        lct=navigator.language.toLowerCase().substring(0, 2);
        }
    else if (navigator.userLanguage)
        {
        lct=navigator.userLanguage.toLowerCase().substring(0, 2);
        }
    else if (navigator.userAgent.indexOf("[")!=-1)
        {
        var debut=navigator.userAgent.indexOf("[");
        var fin=navigator.userAgent.indexOf("]");
        lct=navigator.userAgent.substring(debut+1, fin).toLowerCase();
        }
    return lct;
    }

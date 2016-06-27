function showdoc(iddoc)
    {
    dojo.query(".doc").style("display", "none");
    if (isNaN(iddoc))
        {
        dojo.query("#" + iddoc).style("display", "block");
        }
    else
        {
        dojo.query("#doc" + iddoc).style("display", "block");
        }
    }

dojo.addOnLoad(function()
    {
    var lang_code = obtenirCodeLangueNavig();
    if (lang_code === 'fr')
        {
        showdoc('doc0fr');
        }
    else
        {
        showdoc('doc0en');
        }
    });

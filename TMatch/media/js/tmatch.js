/* includes */
dojo.require('dijit.Dialog');
/* constants, globals */
    var PCLASSES = {
        "1" : "person1",
        "9" : "queen",
        };
    var CLASSES = {
        "-1": "door",
        "-2": "bug",
        "-3": "eraser",
        "-4": "matcher",
        "-5": "gdiamond",
        "-6": "bdiamond",
        "-7": "odiamond",
        };
    var TYPE_SCORE = {
        "played": {
            4: 200,
            3: 50,
            2: 10,
            1: 5,
            "-1": 500,    // Door
            "-2": 10,    // Bug
            "-3": 100,    // Key
            "-4": 250,    // Star
            },
        "comb_item": {
            1: 10,
            2: 20,
            3: 50,
            4: 100,
            5: 150,
            6: 1000,
            "-2": 100,
            "-5": 500,
            "-6": 2500,
            },
        "comb_result": {
            2: 30,
            3: 70,
            4: 150,
            5: 500,
            6: 2500,
            7: 10000,
            "-5": 750,
            "-6": 1500,
            "-7": 5000,
            },
        "destroyed": {
            7: -20000,
            6: -5000,
            5: -1000,
            4: -200,
            3: -75,
            2: -30,
            1: -5,
            "-1": 2000,
            "-2": 10,
            "-5": 500,
            "-6": 1000,
            "-7": 25000,
            },
        };
    var WIDTH = 6;
    var HEIGHT = 6;
    var LAYERS = 1;
    var CELL_WIDTH = 101;
    var CELL_HEIGHT = 81;
    var LEFT_SHIFT = 121;
    var BOTTOM_SHIFT = 10;
    var lang_code = obtenirCodeLangueNavig();
    var map = [];
    var cellsmap = [];
    var personsmap = [];
    var stashes = [];
    var current_stash = 0;
    var current_layer = 0;
    var persons_sequence = 0;
    var current_type = 0;
    var current = null;
    var score = 0;
    var looser = false;
    var step = 0;
/* Randomizers */
function randomType(randommap)
    {
    // if (!randommap) if (step === 0) return -3;
    if (typeof randommap === "undefined") randommap = false;
    var i = Math.random() * 100.0;
    if (i > 99) return 4; // Type 4
    if ((i > 98) && !randommap) return -1; // Door
    if (i > 97) return 3;  // Type 3
    if ((i > 95) && !randommap) return -4; // Star
    if ((i > 92) && !randommap) return -3; // Key
    if (i > 77) return -2; // Bug
    if (i > 52) return 2; // Type 2
    return 1; // Type 1
    }
function randomizeMap()
    {
    /*
    *
    setType(map, 0, 0, 0, -2);
    setType(map, 0, 1, 0, 1);
    setType(map, 0, 2, 0, 1);
    setType(map, 2, 0, 0, 1);
    setType(map, 2, 1, 0, 1);
    setType(map, 2, 2, 0, 1);
    addPerson(0,2,9);
    return;
    /*
    */
    var percent = 0.7;
    var whereToPutQueen = null;
    for (var x = 0; x < WIDTH; x ++)
        {
        for (var y = 0; y < HEIGHT; y ++)
            {
            if (Math.random() > percent)
                {
                rt = randomType(true);
                if ((rt > 0) && (whereToPutQueen === null)) whereToPutQueen = [x,y];
                setType(map, x, y, 0, rt);
                }
            }
        }
    if (whereToPutQueen === null)
        {
        whereToPutQueen = [int(Math.random() * WIDTH), int(Math.random() * HEIGHT)];
        setType(map, whereToPutQueen[0], whereToPutQueen[1], 0, 1);
        }
    addPerson(whereToPutQueen[0], whereToPutQueen[1], 0, 9);
    }
/* Helpers */
function setClass(node, t)
    {
    dojo.removeClass(node);
    dojo.addClass(node, "mapcell");
    if ((typeof t === "undefined") || (t === 0))
        {
        dojo.addClass(node, "empty");
        }
    else if (t > 0)
        {
        dojo.addClass(node, "type_" + t);
        }
    else
        {
        dojo.addClass(node, CLASSES[t]);
        }
    }
function setType(map, x, y, z, t)
    {
    if (typeof map[x] === "undefined") map[x] = [];
    if (typeof map[x][y] === "undefined") map[x][y] = [];
    if (typeof cellsmap[x] === "undefined") cellsmap[x] = [];
    if (typeof cellsmap[x][y] === "undefined") cellsmap[x][y] = [];
    map[x][y][z] = t;
    setClass(cellsmap[x][y][z], t);
    }
function coordsToI(x, y)
    {
    return y*WIDTH + x;
    }
function personCoordToDomCoord(x, y)
    {
    return [(CELL_WIDTH*x+LEFT_SHIFT+30), (CELL_HEIGHT*(HEIGHT-y-1)+BOTTOM_SHIFT+50)];
    }
function personPresent(x, y, z)
    {
    for (var i = 0; i < personsmap.length ; i++)
        {
        p = personsmap[i];
        if ((p['x'] == x) && (p['y'] == y) && (p['z'] == z)) return true;
        }
    return false;
    }
function findEquiv(map, t, x, y, z, seen, ignore)
    {
    if ((typeof ignore === "undefined") && (map[x][y][z] !== t)) return [];
    var result = [[x,y,z]]
    if (typeof seen === "undefined") seen = [];
    seen.push(coordsToI(x,y,z));
    if ((dojo.indexOf(seen, coordsToI(x-1,y,z)) === -1) && (x > 0) && (map[x-1][y][z] === t))
        result = result.concat(findEquiv(map, t, x-1, y, z, seen));
    if ((dojo.indexOf(seen, coordsToI(x+1,y,z)) === -1) && (x < WIDTH-1) && (map[x+1][y][z] === t))
        result = result.concat(findEquiv(map, t, x+1, y, z, seen));
    if ((dojo.indexOf(seen, coordsToI(x,y-1,z)) === -1) && (y > 0) && (map[x][y-1][z] === t))
        result = result.concat(findEquiv(map, t, x, y-1, z, seen));
    if ((dojo.indexOf(seen, coordsToI(x,y+1,z)) === -1) && (y < HEIGHT-1) && (map[x][y+1][z] === t))
        result = result.concat(findEquiv(map, t, x, y+1, z, seen));
    return result;
    }
function getNeighboor(map, x, y, z, diagonals)
    {
    if (typeof diagonals === "undefined") diagonals = false;
    var neighboor = [];
    if (x>0)                       neighboor.push([x-1, y,   z, map[x-1][y]  [z]]);
    if (x<WIDTH-1)                 neighboor.push([x+1, y,   z, map[x+1][y]  [z]]);
    if (y>0)                       neighboor.push([x,   y-1, z, map[x]  [y-1][z]]);
    if (y<HEIGHT-1)                neighboor.push([x,   y+1, z, map[x]  [y+1][z]]);

    /* diagonals */
    if (diagonals)
        {
        if ((x>0) && (y>0))              neighboor.push([x-1, y-1, z, map[x-1][y-1][z]]);
        if ((x>0) && (y<HEIGHT-1))       neighboor.push([x-1, y+1, z, map[x-1][y+1][z]]);
        if ((x<WIDTH-1) && (y>0))        neighboor.push([x+1, y-1, z, map[x+1][y-1][z]]);
        if ((x<WIDTH-1) && (y<HEIGHT-1)) neighboor.push([x+1, y+1, z, map[x+1][y+1][z]]);
        }
    return neighboor;
    }
function addPerson(x, y, z, t)
    {
    domcoords = personCoordToDomCoord(x,y,z);
    my_id = persons_sequence;
    persons_sequence += 1;
    domnode= dojo.create("div", {"style":"bottom:"+domcoords[1]+";left:"+domcoords[0]+";",innerHTML:"&nbsp;","pidx":persons_sequence}, dojo.byId("personscontainer"));
    tooltipnode= dojo.create("div", {}, domnode);
    p = {
        type: t,
        domnode: domnode,
        tooltipnode: tooltipnode,
        x:x,
        y:y,
        z:z,
        idx:persons_sequence
        };
    dojo.addClass(p["domnode"], PCLASSES[t]);
    dojo.addClass(p["tooltipnode"], "persontt");
    dojo.connect(p["domnode"], "onclick", function(evt)
        {
        idx = parseInt(dojo.attr(this, "pidx"));
        if (isNaN(idx)) return;
        current_stash = idx;
        setClass(stash, stashes[current_stash]);
        });
    personsmap.push(p);
    }
function findPerson(idx)
    {
    for (var i = 0; i < personsmap.length ; i ++)
        {
        p = personsmap[i];
        if (p['idx'] == idx) return p;
        }
    }
function loosePerson(p)
    {
    // Change the current stash to the first "other person"
    var found = false;
    var my_index_in_map = null;
    for (var i = 0; i < personsmap.length ; i ++)
        {
        op = personsmap[i];
        if (op['idx'] === p['idx'])
            {// that's me
            my_index_in_map = i;
            }
        else
            {
            current_stash = op['idx'];
            setClass(stash, stashes[current_stash]);
            found = true;
            }
        }
    if (my_index_in_map !== null)
        {
        p['domnode'].parentNode.removeChild(p['domnode']);
        personsmap.splice(my_index_in_map, 1);
        }
    if (!found) // I was the last one ?
        {
        looser = true;
        var msg = dojo.create("div", {innerHTML: "Looser"}, "container");
        dojo.addClass(msg, "message");
        }
    }

/* Map functions */
function makeMap(loaded_map)
    {
    for (var x = 0; x < WIDTH; x++)
        {
        for (var y = 0; y < HEIGHT; y++)
            {
            for (var z = 0; z < LAYERS; z++)
                {
                /* map */
                if (typeof map[x] === "undefined") map[x] = [];
                if (typeof map[x][y] === "undefined") map[x][y] = [];
                map[x][y][z] = (typeof loaded_map === "undefined" ? 0 : loaded_map[x][y][z]);
                /* cellsmap */
                if (typeof cellsmap[x] === "undefined") cellsmap[x] = [];
                if (typeof cellsmap[x][y] === "undefined") cellsmap[x][y] = [];
                var layer = zToVirtLayer(z);
                cellsmap[x][y][z] = dojo.create("div", {"tmatchx":x,"tmatchy":y,"tmatchz":z,"style":"bottom:"+(CELL_HEIGHT*(HEIGHT-y-1)+BOTTOM_SHIFT)+";left:"+(CELL_WIDTH*x+LEFT_SHIFT)+";",innerHTML:"&nbsp;"}, dojo.byId("playzone"+(layer > 0 ? "_sky" : (layer < 0 ? "_underground" : ""))));
                if (z !== 0) dojo.style(cellsmap[x][y][z], "display", "none");
                setClass(cellsmap[x][y][z], map[x][y][z]);
                }
            }
        }
    }

/* Game turn functions */
function fallTile(map, x, y, z)
    {
    var l = zToVirtLayer(z);
    if (l <= 0) return z;
    var new_l = l - 1;
    var new_z = virtLayerToZ(new_l);
    if (map[x][y][new_z] !== 0) return z;
    setType(map, x, y, new_z, map[x][y][z]);
    setType(map, x, y, z, 0);
    return fallTile(map, x, y, new_z);
    }
function checkComb(map, t, x, y, z)
    {
    var comb = findEquiv(map, t, x, y, z);
    var newtype = t + 1;
    if (t < -4) newtype = t - 1;
    if ((newtype <= -8) || (newtype >= 8))
        {
        return;
        }
    if (comb.length > 2 + Math.abs(zToVirtLayer(z)))
        {
        for (var i = 0; i < comb.length; i ++)
            {
            u = comb[i][0]; v = comb[i][1]; w = comb[i][2];
            if (typeof TYPE_SCORE['comb_item'][t] !== undefined)
                {
                score += TYPE_SCORE['comb_item'][t];
                }
            setType(map, u, v, w, 0);
            }
        setType(map, x, y, z, newtype);
        z = fallTile(map, x, y, z);
        checkComb(map, newtype, x, y, z);
        if (typeof TYPE_SCORE['comb_result'][newtype] !== undefined)
            {
            score += TYPE_SCORE['comb_result'][newtype];
            }
        if (newtype > 5) addPerson(x, y, z, 1);
        if (newtype === 7) addNewLayer();
        }
    }
function matchAll(map, x, y, z)
    {
    result = [];
    var possible_types = [];
    var t = 0;
    var equiv = [];
    if (x>0) possible_types.push(map[x-1][y][z]);
    if (x<WIDTH-1) possible_types.push(map[x+1][y][z]);
    if (y>0) possible_types.push(map[x][y-1][z]);
    if (y<HEIGHT-1) possible_types.push(map[x][y+1][z]);
    possible_types = sort_unique(possible_types);
    for(var i = 0; i < possible_types.length ; i++)
        {
        t = possible_types[i];
        if (((t < 1) && (t > -5)) || (t < -6) || (t > 6)) continue; // we can match regular blocks and tombstones
        equiv = findEquiv(map, t, x, y, z, [], true);
        if (equiv.length > 2 + Math.abs(zToVirtLayer(z)))
            {
            map[x][y][z] = t;
            checkComb(map, t, x, y, z);
            return true;
            }
        }
    return false;
    }
function bugMove(map, x, y, z)
    {
    var nei = getNeighboor(map, x, y, z);
    nei.sort(function() { return (Math.round(Math.random())-0.5); });
    for (var i = 0; i < nei.length; i++)
        {
        n = nei[i];
        if (n[3] === 0)
            {
            setType(map, n[0], n[1], n[2], map[x][y][z]);
            setType(map, x, y, z, 0);
            break;
            }
        }
    }
function personMoveTo(p, x, y, z)
    {
    p['x'] = x;
    p['y'] = y;
    p['z'] = z;
    domcoords = personCoordToDomCoord(x,y,z);
    dojo.style(p['domnode'], "bottom", domcoords[1]);
    dojo.style(p['domnode'], "left", domcoords[0]);
    }
function checkLooseCondition()
    {
    /* Loose condition is only checked for the main layer */
    var z = 0;
    for (var x = 0; x < WIDTH; x ++)
        {
        for (var y = 0; y < HEIGHT ; y ++)
            {
            if (map[x][y][z] === 0)
                {
                return false;
                }
            }
        }
    return true;
    }
function checkBugKill(map, x, y, z)
    {
    other_bugs = findEquiv(map, -2, x, y, z);
    for (var i = 0; i < other_bugs.length; i ++)
        {
        ob = other_bugs[i];
        nei = getNeighboor(map, ob[0], ob[1], ob[2]);
        for (var j = 0; j < nei.length; j ++)
            {
            n = nei[j];
            if (map[n[0]][n[1]][n[2]] == 0)
                {
                return 0;
                }
            }
        }
    for (var i = 0; i < other_bugs.length; i ++)
        {
        ob = other_bugs[i];
        if (typeof TYPE_SCORE['comb_result'][-5] !== undefined)
            {
            score += TYPE_SCORE['comb_result'][-5];
            }
        setType(map, ob[0], ob[1], ob[2], -5);
        }
    checkComb(map, -5, x, y, z);
    return other_bugs.length;
    }
function doPersonStep(p)
    {
    var nei = getNeighboor(map, p['x'],p['y'],p['z'], true);
    var moveOrNot = (Math.random() > 0.5);
    var onWater = (map[p['x']][p['y']][p['z']] === 0);
    var couldMove = false;
    if ((moveOrNot) || (onWater)) // always move if on water
        {
        nei.sort(function() { return (Math.round(Math.random())-0.5); });
        for (var i = 0; i < nei.length; i++)
            {
            n = nei[i];
            if ((n[3] > 0) && (!personPresent(n[0], n[1], n[2])))
                {
                personMoveTo(p, n[0], n[1], n[2]);
                couldMove = true;
                break;
                }
            }
        }
    if ((!couldMove) && (onWater)) // He couldn't move
        {
        loosePerson(p);
        }
    }
function doOneStep(changetype)
    {
    if (typeof changetype === "undefined") changetype = true;
    if (changetype)
        {
        current_type = randomType();
        setClass(current, current_type);
        }
    var bugs = [];
    for (var x = 0; x < WIDTH; x ++)
        {
        for (var y = 0; y < HEIGHT ; y ++)
            {
            for (var z = 0; z < LAYERS ; z ++)
                {
                if (map[x][y][z] === -2)
                    {
                    bugs.push([x,y,z]);
                    }
                }
            }
        }
    for (var i = 0; i < bugs.length; i++)
        {
        b = bugs[i];
        // We check again the type in case this bug was destroyed by another one
        if (map[b[0]][b[1]][b[2]] === -2)
            {
            killcount = checkBugKill(map, b[0], b[1], b[2]);
            if (killcount > 0)
                {
                if (typeof TYPE_SCORE['comb_item'][-2] !== undefined)
                    {
                    score += killcount * TYPE_SCORE['comb_item'][-2];
                    }
                }
            else
                {
                bugMove(map, b[0], b[1], b[2]);
                }
            }
        }
    for (var i = 0; i < personsmap.length; i++)
        {
        p = personsmap[i];
        if (p["type"] !== 0) doPersonStep(p);
        }
    if (checkLooseCondition())
        {
        looser = true;
        var msg = dojo.create("div", {innerHTML: "Looser"}, "container");
        dojo.addClass(msg, "message");
        }
    dojo.attr("score", "innerHTML", score);
    step += 1;
    }
function virtLayerToZ(l)
    {
    l = l * 2;
    if (l > 0) l = l - 1;
    if (l < 0) l = -l;
    return l;
    }
function zToVirtLayer(z)
    {
    if (z % 2 === 0) z = -z;
    if (z > 0) z = z + 1;
    z = z / 2;
    return z;
    }
function switchToUpper()
    {
    current_layer += 1;
    upper_layer = Math.floor(LAYERS / 2);
    lower_layer = Math.floor((2-LAYERS)/2);
    if (current_layer > upper_layer) current_layer = lower_layer;
    switchToLayer(virtLayerToZ(current_layer));
    }
function switchToLower()
    {
    current_layer -= 1;
    upper_layer = Math.floor(LAYERS / 2);
    lower_layer = Math.floor((2-LAYERS)/2);
    if (current_layer < lower_layer) current_layer = upper_layer;
    switchToLayer(virtLayerToZ(current_layer));
    }
function addNewLayer()
    {
    var new_z = LAYERS;
    var new_layer = zToVirtLayer(new_z);
    for (var x = 0; x < WIDTH; x++)
        {
        for (var y = 0; y < HEIGHT; y++)
            {
            /* map */
            if (typeof map[x] === "undefined") map[x] = [];
            if (typeof map[x][y] === "undefined") map[x][y] = [];
            map[x][y][new_z] = 0;
            /* cellsmap */
            if (typeof cellsmap[x] === "undefined") cellsmap[x] = [];
            if (typeof cellsmap[x][y] === "undefined") cellsmap[x][y] = [];
            cellsmap[x][y][new_z] = dojo.create("div", {"tmatchx":x,"tmatchy":y,"tmatchz":new_z,"style":"bottom:"+(CELL_HEIGHT*(HEIGHT-y-1)+BOTTOM_SHIFT)+";left:"+(CELL_WIDTH*x+LEFT_SHIFT)+";",innerHTML:"&nbsp;"}, dojo.byId("playzone"+(new_layer > 0 ? "_sky" : (new_layer < 0 ? "_underground" : ""))));
            if (new_z !== 0) dojo.style(cellsmap[x][y][new_z], "display", "none");
            setClass(cellsmap[x][y][new_z], map[x][y][new_z]);
            }
        }
    LAYERS += 1;
    if (LAYERS > 1) dojo.style('upswitch', 'display', 'block');
    if (LAYERS > 2) dojo.style('dnswitch', 'display', 'block');
    }
function switchToLayer(target)
    {
    for (var x = 0; x < WIDTH; x ++)
        {
        for (var y = 0; y < HEIGHT ; y ++)
            {
            for (var z = 0; z < LAYERS ; z ++)
                {
                dojo.style(cellsmap[x][y][z], "display", (z===target ? "block" : "none"));
                }
            }
        }
    for (var i = 0; i < personsmap.length; i ++)
        {
        var p = personsmap[i];
        dojo.style(p.domnode, "display", (target === p.z ? "block" : "none"));
        }
    dojo.attr('currentLayerDisplay', 'innerHTML', zToVirtLayer(target));
    }

function clearGame()
    {
    for (var i = 0; i < personsmap.length; i++)
        {
        var p = personsmap[i];
        p.domnode.parentNode.removeChild(p.domnode);
        }
    }
/* Dialogs */
function openLoadDialog()
    {
    var dial = dijit.byId('loadDialog');
    if (dial) dijit.byId('loadDialog').destroyRecursive();
    dial = new dijit.Dialog({id:'loadDialog',style:'width:500px;',title:'Load game'});
    var ul = dojo.create('ul', {}, dial.containerNode);
    var savegames = TMatchSaveLoader.listSaves();
    var li = null;
    for (var i in savegames)
        {
        savename = savegames[i];
        li = dojo.create('li', {}, ul);
        ce_div = dojo.create('span', {innerHTML: savename}, li);
        dojo.connect(ce_div, "onclick", function(evt)
            {
            savename = dojo.attr(evt.target, 'innerHTML');
            initGame(savename);
            dijit.byId('loadDialog').destroyRecursive();
            });
        ce_div = dojo.create('span', {innerHTML: '(Export)', savename: savename}, li);
        dojo.style(ce_div, "margin-left", "30px");
        dojo.connect(ce_div, "onclick", function(evt)
            {
            savename = dojo.attr(evt.target, 'savename');
            var loaded_data = TMatchSaveLoader.load(savename);
            dijit.byId('loadDialog').destroyRecursive();
            var expDial = dijit.byId('exportDialog');
            if (!expDial)
                {
                expDial = new dijit.Dialog({id:'exportDialog', style:'width: 500px;', title:'Copy this to export'});
                dojo.create('textarea', {id:'exportTA',innerHTML: dojo.toJson(loaded_data), rows: 10, cols: 58}, expDial.containerNode);
                }
            dojo.attr('exportTA', 'innerHTML', dojo.toJson(loaded_data));
            expDial.show();
            });
        }
        dojo.create('div', {innerHTML: 'Or paste your exported savegame here :'}, dial.containerNode);
        dojo.create('textarea', {id:'importExportedSavegame',rows: 10, cols: 58}, dial.containerNode);
        var bouton = dojo.create('button', {innerHTML: 'OK'}, dial.containerNode);
        dojo.connect(bouton, "onclick", function()
            {
            try
                {
                var savename = TMatchSaveLoader.importSave(dojo.attr('importExportedSavegame', 'value'));
                initGame(savename)
                dijit.byId('loadDialog').destroyRecursive();
                }
            catch (e)
                {
                alert('Incorrect data : '+ e);
                }
            });
    dial.show();
    }
function openSaveDialog()
    {
    var dial = dijit.byId('saveDialog');
    if (!dial)
        {
        dial = new dijit.Dialog({id:'saveDialog',style:'width:300px;',title:'Save game'});
        var saisie = dojo.create('input', {type: 'text'}, dial.containerNode);
        var bouton = dojo.create('button', {innerHTML: 'OK'}, dial.containerNode);
        dojo.connect(bouton, "onclick", function()
            {
            var savename = dojo.attr(saisie, 'value');
            if (savename !== '')
                {
                TMatchSaveLoader.save(savename, map, current_type, score, personsmap, current_stash, stashes);
                dijit.byId('saveDialog').destroyRecursive();
                }
            });
        }
    dial.show();
    }
function initGame(savename)
    {
    clearGame();
    map = [];
    cellsmap = [];
    personsmap = [];
    stashes = [];
    current_stash = 0;
    current_layer = 0;
    persons_sequence = 0;
    current_type = 0;
    current = dojo.byId('current');
    score = 0;
    looser = false;
    step = 0;
    if (typeof savename === "undefined")
        {
        /* Prepare UI */
        current_type = randomType();
        var container = dojo.create("div", {id: "container"}, dojo.body());
        if (current === null)
            {
            current = dojo.create("div", {id: "current", innerHTML:(lang_code === "fr" ? "En cours" : "Current")}, container);
            }
        dojo.create("div", {id: "score", innerHTML: score}, container);
        var stash = dojo.create("div", {id: "stash", innerHTML: (lang_code === "fr" ? "Réserve" : "Stash")}, container);
        dojo.connect(stash, "onclick", function(evt)
            {
            if (looser) return;
            var old_stash = stashes[current_stash];
            var old_person = findPerson(current_stash);
            var stashed_item = current_type;
            if (typeof old_person === "undefined") old_person = findPerson(1);
            stashes[current_stash] = stashed_item;
            setClass(stash, stashes[current_stash]);
            if ((typeof old_stash !== "undefined") && (old_stash !== 0))
                {
                current_type = old_stash;
                setClass(current, current_type);
                }
            else
                {
                current_type = randomType();
                setClass(current, current_type);
                }
            setClass(old_person['tooltipnode'], stashed_item);
            });
        var playzone = dojo.create("div", {id: "playzone"}, container);
        dojo.create("div", {id: "playzone_sky"}, playzone);
        dojo.create("div", {id: "playzone_underground"}, playzone);
        dojo.create("div", {id: "personscontainer"}, container);
        dojo.create("div", {id: 'currentLayerDisplay', innerHTML: '0'}, dojo.create("div", {id: 'currentLayerDisplayContainer'}, container));
        var layerswitcher = dojo.create("div", {id: "layerswitcher"}, container);
        var upswitch = dojo.create("div", {id:'upswitch',innerHTML: "&uarr;"}, layerswitcher);
        dojo.style(upswitch, "display", "none");
        dojo.connect(upswitch, "onclick", switchToUpper);
        var dnswitch = dojo.create("div", {id:'dnswitch',innerHTML: "&darr;"}, layerswitcher);
        dojo.style(dnswitch, "display", "none");
        dojo.connect(dnswitch, "onclick", switchToLower);
        var loadbtn = dojo.create("div", {id:"loadbtn", innerHTML: "Load"}, container)
        dojo.connect(loadbtn, "onclick", openLoadDialog);
        var savebtn = dojo.create("div", {id:"savebtn", innerHTML: "Save"}, container)
        dojo.connect(savebtn, "onclick", openSaveDialog);

        /* Prepare map */
        makeMap();
        randomizeMap();
        }
    else
        {
        var loaded_data = TMatchSaveLoader.load(savename);
        if (loaded_data === null)
            {
            initGame();
            }
        else
            {
            makeMap(loaded_data.map);
            current_type = loaded_data.current_type;
            for (var i = 0; i < loaded_data.personsmap.length; i ++)
                {
                var p = loaded_data.personsmap[i];
                addPerson(p.x, p.y, p.z, p.type);
                }
            stashes = dojo.clone(loaded_data.stashes);
            current_stash = loaded_data.current_stash;
            score = loaded_data.score;
            dojo.attr("score", "innerHTML", score);
            looser = false;
            }
        }
    setClass(current, current_type);
    for (var x = 0; x < WIDTH ; x ++)
        {
        for (var y = 0; y < HEIGHT; y ++)
            {
            for (var z = 0; z < LAYERS; z ++)
                {
                dojo.connect(cellsmap[x][y][z], "onclick", function(evt)
                    {
                    if (looser) return;
                    x = parseInt(dojo.attr(this, "tmatchx"));
                    y = parseInt(dojo.attr(this, "tmatchy"));
                    z = parseInt(dojo.attr(this, "tmatchz"));
                    celltype = map[x][y][z];
                    if ((evt.offsetY < 50) && (y > 0))
                        {
                        y-=1;
                        celltype = map[x][y][z];
                        }
                    if ((current_type === -3) && (celltype !== 0)) // eraser
                        {
                        if (typeof TYPE_SCORE['played'][current_type] !== undefined)
                            {
                            score += TYPE_SCORE['played'][current_type];
                            }
                        if (typeof TYPE_SCORE['destroyed'][celltype] !== undefined)
                            {
                            score += TYPE_SCORE['destroyed'][celltype];
                            }
                        setType(map, x, y, z, 0);
                        doOneStep();
                        }
                    else if (celltype === 0)
                        {
                        if (typeof TYPE_SCORE['played'][current_type] !== undefined)
                            {
                            score += TYPE_SCORE['played'][current_type];
                            }
                        if (current_type > 0)
                            {
                            setType(map, x, y, z, current_type);
                            checkComb(map, current_type, x, y, z);
                            doOneStep();
                            }
                        else if (current_type === -4) // matcher
                            {
                            if (matchAll(map, x, y, z))
                                {
                                doOneStep();
                                }
                            }
                        else if ((current_type === -1) || (current_type === -2))
                            {
                            setType(map, x, y, z, current_type);
                            doOneStep();
                            }
                        }
                    });
                }
            }
        }
    }
/* Main */
dojo.addOnLoad(function()
    {
    initGame();
    });

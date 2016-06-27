var TMatchSaveLoader = {

    save: function(savename, map, current_type, score, personsmap, current_stash, stashes)
        {
        var object_to_save = {
            savename: savename,
            isTMatchSave: true,
            map: dojo.clone(map),
            current_type: current_type,
            score: score,
            personsmap: [],
            current_stash: current_stash,
            stashes: dojo.clone(stashes),
            };
        for (var i = 0; i < personsmap.length; i ++)
            {
            var p = personsmap[i];
            var serializable_p = {
                type: p.type,
                x: p.x,
                y: p.y,
                z: p.z,
                };
            object_to_save['personsmap'].push(serializable_p);
            }
        localStorage.setItem('TMatch_savegame_' + savename, dojo.toJson(object_to_save));
        },

    load: function(savename)
        {
        var json_data = localStorage.getItem('TMatch_savegame_' + savename);
        if (json_data === null) return null;
        return dojo.fromJson(json_data);
        },

    importSave: function(json_data)
        {
        var data = dojo.fromJson(json_data);
        var savename = data.savename;
        localStorage.setItem('TMatch_savegame_' + savename, json_data);
        return savename;
        },

    listSaves: function()
        {
        var result = [];
        for (var i in localStorage)
            {
            var stored_data = localStorage[i];
            if ((typeof stored_data !== "undefined") &&
                (i.slice(0, 'TMatch_savegame_'.length) === 'TMatch_savegame_'))
                {
                result.push(dojo.fromJson(stored_data).savename);
                }
            }
        return result;
        },

    _checkAvailability: function()
        {
        if (localStorage)
            {
            return true;
            }
        else
            {
            return false;
            }
        }
    };

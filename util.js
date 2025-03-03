const Gi = imports._gi;
const Gio = imports.gi.Gio;
const GioSSS = Gio.SettingsSchemaSource;

const Self = imports.misc.extensionUtils.getCurrentExtension();

/**
 * getSettings:
 * @schema: (optional): the GSettings schema id
 *
 * Builds and return a GSettings schema for @schema, using schema files
 * in extensionsdir/schemas. If @schema is not provided, it is taken from
 * metadata['settings-schema'].
 */
function getSettings(schema) {

    schema = schema || extension.metadata['settings-schema'];

    const GioSSS = Gio.SettingsSchemaSource;

    // check if this extension was built with "make zip-file", and thus
    // has the schema files in a subfolder
    // otherwise assume that extension has been installed in the
    // same prefix as gnome-shell (and therefore schemas are available
    // in the standard folders)
    let schemaDir = Self.dir.get_child('schemas');
    let schemaSource;
    if (schemaDir.query_exists(null)) {
        schemaSource = GioSSS.new_from_directory(schemaDir.get_path(), GioSSS.get_default(), false);
    } else {
        schemaSource = GioSSS.get_default();
    }
    let schemaObj = schemaSource.lookup(schema, true);
    if (!schemaObj)
        throw new Error('Schema ' + schema + ' could not be found for extension ' + Self.metadata.uuid + '. Please check your installation.');

    return new Gio.Settings({
        settings_schema: schemaObj
    });
}

function hookVfunc(proto, symbol, func) {
    proto[Gi.hook_up_vfunc_symbol](symbol, func);
}

function overrideProto(proto, overrides) {
    backup = {}
    for (var symbol in overrides) {
        backup[symbol] = proto[symbol];
        if (symbol.startsWith('vfunc')) {
            hookVfunc(proto, symbol.substr(6), overrides[symbol]);
        } else {
            proto[symbol] = overrides[symbol];
        }
    }
    return backup;
}
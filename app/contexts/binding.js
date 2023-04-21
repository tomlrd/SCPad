const path = require("path");
const fs = require("fs");
const convert = require('xml-js');
const Bindings = require("../public/binds.json");
const { ipcMain, dialog, BrowserWindow } = require('electron');
var overwrite = true
const datas = {
    keybindFile: String,
    layoutPath: String,
    bindings: []
}

ipcMain.on('open:layoutPath', async (e) => {
    dialog.showOpenDialog({ properties: ['openDirectory'] }).then(result => {
        if (result.canceled !== true) {
            e.reply("return:layoutPath", result.filePaths[0])
        }
    })
})
ipcMain.on('open:keybindFile', async (e) => {
    dialog.showOpenDialog({ properties: ['openFile'] }).then(result => {
        if (result.canceled !== true) {
            if (path.extname(result.filePaths[0]).toLowerCase() === ".xml") {
                e.reply(`return:keybindFile`, result.filePaths[0])
            }
        }
    })
})

ipcMain.on('read:xml', async (e,) => {
    readMapping()
})
ipcMain.on('set:layoutPath', async (e, arg) => {
    console.log(arg);
    datas.layoutPath = arg
})
ipcMain.on('set:keybindFile', async (e, arg) => {
    console.log(arg);
    datas.keybindFile = arg
    readMapping()
})

async function readMapping() {
    datas.bindings = []
    const mainWin = BrowserWindow.getFocusedWindow()
    const xml = fs.readFileSync(datas.keybindFile);
    const js = convert.xml2js(xml, { compact: false, alwaysArray: true, addParent: true });
    js.elements[0].elements.forEach(el => {
        if (el.name !== "actionmap") {
            return false
        }
        el.elements.forEach(async _el => {
            for (let i = 0; i < _el.elements.length; i++) {
                if (!Bindings.hasOwnProperty(_el.elements[i].parent.attributes.name)) {
                    break // check binds.json
                }
                if (/^kb1_\s$/.test(_el.elements[i].attributes.input)) {
                    // check if bind is reset (= "kb1_ " alone)
                    let bind = await formatKey(_el.elements[i].parent.attributes.name, Bindings[`${_el.elements[i].parent.attributes.name}`].key, Bindings[`${_el.elements[i].parent.attributes.name}`].doubletap, Bindings[`${_el.elements[i].parent.attributes.name}`].hold)
                    mainWin.webContents.send('new:bind', bind)
                    datas.bindings.push(bind)
                } else {
                    let dt = _el.elements[i].attributes.activationMode ? _el.elements[i].attributes.activationMode : undefined
                    let bind = await formatKey(_el.elements[i].parent.attributes.name, _el.elements[i].attributes.input, dt,Bindings[`${_el.elements[i].parent.attributes.name}`].hold)
                    mainWin.webContents.send('new:bind', bind)
                    datas.bindings.push(bind)
                }
                break // stop to first kb1_ found
            }
        });
    });
    setTimeout(() => {
        // todo: when resolve
        overwrite === true ? owBindings() : false;
    }, 1000);
}

async function owBindings() {
    const mainWin = BrowserWindow.getFocusedWindow()
    // if entry doesnt exist in xml, use default from binds.json
    for (const [key, value] of Object.entries(Bindings)) {
        let found = datas.bindings.find(bind => {
            return bind.name === key
        });
        if (!found) {
            let name = key, key2 = value.key
            let bind = await formatKey(name, key2, value.doubletap, value.hold)
            datas.bindings.push(bind)
            mainWin.webContents.send('new:bind', bind)
        }
    }
}

async function formatKey(name, str, doubletap, hold) {
    let modif = str.substring(str.indexOf("+"), -1).replace('kb1_', '')
    let key = str.substring(str.indexOf('+') + 1)

    // NO RIGHT MODIFICATOR !!!!
    switch (modif) {
        case "lctrl" || "rctrl":
            modif = "Control"
            break;
        case "lalt" || "ralt":
            modif = "Alt"
            break;
        case "lshift" || "rshift":
            modif = "Shift"
            break;
    }

    if (modif.length !== 0) {
        return { name, keys: [modif, key], doubletap, hold  }
    } else {
        return { name, keys: [key], doubletap, hold }
    }
}

const returnDatas = async () => {
    return datas
}
module.exports = { returnDatas }
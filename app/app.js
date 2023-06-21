const { app, BrowserWindow, BrowserView, ipcMain, dialog } = require("electron");
const os = require("os")
const path = require("path");
const ejse = require('ejs-electron')
const express = require("express");
const eapp = require('express')();
const server = require('http').createServer(eapp);
const io = require('socket.io')(server);
const binding = require('./contexts/binding')
const nut = require("@nut-tree/nut-js");
nut.keyboard.config.autoDelayMs = 30
let mainWin, pingLoop;

///////////////////////////
const APPDATAS = {
  name: app.getName(),
  version: app.getVersion()
}
const OPTIONS = {
  nosleep: true,
  overwrite: true,
  port: 3004
}

///////////////////////////
app.whenReady().then(async () => {
  mainWin = new BrowserWindow({
    width: 550,
    height: 600,
    webPreferences: {
      devTools: true,
      preload: path.join(__dirname, "preload.js")
    },
  });

  setTimeout(() => {
    mainWin.loadFile(path.join(__dirname, `/views/landing.ejs`), { query: { "APPDATAS": JSON.stringify(APPDATAS) } })
    if (!app.isPackaged) {
      mainWin.webContents.openDevTools({ mode: "detach" })
    }
  }, 500);
})

ipcMain.on('run:server', async (e) => {
  createServer()
})
ipcMain.on('stop:server', async (e) => {
  server.close(() => {
    mainWin.webContents.send('server:status', false)
  });
})
ipcMain.on('set:options', async (e, arg) => {
  console.log(arg);
  try {
    OPTIONS[`${arg[0]}`] = arg[1]
    console.log(OPTIONS);
  } catch (error) {
    console.log(error);
  }
})

async function createServer() {
  try {
    let dataserv = await binding.returnDatas()
    //console.log(dataserv);
    eapp.use((req, res, next) => {
      res.header("binding", JSON.stringify(dataserv.bindings));
      res.set({
        "binding": JSON.stringify(dataserv.bindings),
        "options": JSON.stringify(OPTIONS)
      });
      next();
    });
    console.log(dataserv.layoutPath);
    eapp.use(express.static(dataserv.layoutPath));

    io.on('connection', (socket) => {
      socket.on('send:key', async (keyname) => {
        await keySys(keyname, dataserv)
      });
      socket.on('send:key:auto', async (id) => {
        loopSys(dataserv)
      });
    });
    server.on('error', (err) => {
      console.log(err);
    });
    server.listen(OPTIONS.port);
    mainWin.webContents.send('server:status', true)
  } catch (error) {
    console.log(error);
    mainWin.webContents.send('server:status', false)
  }
}

async function loopSys(dataserv) {
  let pingKey = dataserv.bindings.find(item => item.name === 'v_invoke_ping')
  let nutKey = nut.Key[`${pingKey.keys.key}`]
  switch (id) {
    case "ping5":
      if (pingLoop === undefined) {
        pingLoop = setInterval(async function () {
          await nut.keyboard.pressKey(nutKey)
          await nut.keyboard.releaseKey(nutKey)
        }, 5000);
      } else {
        clearInterval(pingLoop);
        pingLoop = undefined
      }
      break;
    case "ping10":
      if (pingLoop === undefined) {
        pingLoop = setInterval(async function () {
          await nut.keyboard.pressKey(nutKey)
          await nut.keyboard.releaseKey(nutKey)
        }, 10000);
      } else {
        clearInterval(pingLoop);
        pingLoop = undefined
      }
      break;
  }
  console.log('auto');
}

async function keySys(keyname, dataserv, id) {
  let found = dataserv.bindings.find(bind => {
    // last check
    return bind.name === keyname
  });
  if (found) {
    let nutKey = found.keys.key.length === 1 ? nut.Key[`${found.keys.key.toUpperCase()}`] : nut.Key[`${found.keys.key}`]
    let isHold = false
    let doubletap = found.doubletap
    console.log(nutKey, isHold, doubletap);
    try {
      ///// hold must be set in binds.json
      if (found.name === "v_toggle_qdrive_engagement" || found.name === "v_exit_seat") { isHold = true }
      if (found.keys.modifiers.length > 0) {
        let nutModifs = []
        found.keys.modifiers.forEach(el => {
          nutModifs.push(nut.Key[`${el}`])
        });
        pressKeys(nutKey, ...nutModifs, isHold, doubletap)
      } else {
        pressKeys(nutKey, null, isHold, doubletap)
      }
    } catch (error) {
      console.log(error);
    }
  }
}

async function pressKeys(nutKey, nutModifs, isHold, doubletap) {
  if (nutModifs) {
    console.log(nutModifs);
    if (isHold === true) {
      await nut.keyboard.pressKey(nutModifs, nutKey)
      setTimeout(async () => {
        await nut.keyboard.releaseKey(nutModifs, nutKey)
      }, 2000);
    } else if (doubletap) {
      await nut.keyboard.pressKey(nutModifs, nutKey)
      await nut.keyboard.releaseKey(nutModifs, nutKey)
      await nut.keyboard.pressKey(nutModifs, nutKey)
      await nut.keyboard.releaseKey(nutModifs, nutKey)
    } else {
      await nut.keyboard.pressKey(nutModifs, nutKey)
      await nut.keyboard.releaseKey(nutModifs, nutKey)
    }
  } else {
    if (isHold === true) {
      await nut.keyboard.pressKey(nutKey)
      setTimeout(async () => {
        await nut.keyboard.releaseKey(nutKey)
      }, 2000);
    } else if (doubletap) {
      await nut.keyboard.pressKey(nutKey)
      await nut.keyboard.releaseKey(nutKey)
      await nut.keyboard.pressKey(nutKey)
      await nut.keyboard.releaseKey(nutKey)
    } else {
      await nut.keyboard.pressKey(nutKey)
      await nut.keyboard.releaseKey(nutKey)
    }
  }
}
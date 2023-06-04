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
let mainWin, loaderView;

///////////////////////////
const APPDATAS = {
  name: app.getName(),
  version: app.getVersion()
}
const OPTIONS = {
  nosleep: true
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

  loaderView = new BrowserView({
    webPreferences: {
      devTools: true
    }
  });

  loaderView.setBounds({ x: 0, y: 0, width: mainWin.getBounds().width, height: mainWin.getBounds().height })
  await loaderView.webContents.loadFile(path.join(__dirname, '/views/loading.html'))

  setTimeout(() => {
    mainWin.loadFile(path.join(__dirname, `/views/landing.ejs`), { query: { "APPDATAS": JSON.stringify(APPDATAS) } })
    if (!app.isPackaged) {
      //loaderView.webContents.openDevTools({ mode: "detach" })
      mainWin.webContents.openDevTools({ mode: "detach" })
    }
  }, 500);
})


ipcMain.on('run:server', async (e) => {
  createServer()
})
////////// ROUTING ////////////
ipcMain.on('route', async (e, nextRoute) => {
  await mainWin.loadFile(path.join(__dirname, `/views/${nextRoute}.ejs`), { query: { 'APPDATAS': JSON.stringify(APPDATAS) } })
})
////////// LOADER ////////////
ipcMain.on('loading', async (e, status) => {
  switch (status) {
    case true:
      mainWin.addBrowserView(loaderView)
      loaderView.setBounds({ x: 0, y: 0, width: mainWin.getBounds().width, height: mainWin.getBounds().height })
      break;
    case false:
      mainWin.removeBrowserView(loaderView)
      break;
  }
})

async function createServer() {
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
  eapp.use(express.static(dataserv.layoutPath));

  io.on('connection', (socket) => {
    socket.on('send:key', async (keyname) => {
      await keySys(keyname, dataserv)
    });
  });
  server.listen(3004);
}

async function keySys(keyname, dataserv) {
  let found = dataserv.bindings.find(bind => {
    // last check
    return bind.name === keyname
  });
  if (found) {
    let nutKey = found.keys.key.length === 1 ? nut.Key[`${found.keys.key.toUpperCase()}`] : nut.Key[`${found.keys.key}`]
    console.log(nutKey);
    try {
      ///// NO HOLD IS WORKING IN ANY JS LIB IDK WHY (and nutjs is the only accepting left/right modifiers)
      ///// USE DOUBLETAP INSTEAD !!!!
      if (found.keys.modifiers.length > 0) {
        let nutModifs = []
        found.keys.modifiers.forEach(el => {
          nutModifs.push(nut.Key[`${el}`])
        });
        console.log(nutModifs);
        if (found.doubletap === true) {
          console.log('ok');
          await nut.keyboard.pressKey(...nutModifs, nutKey)
          await nut.keyboard.releaseKey(...nutModifs, nutKey)
          await nut.keyboard.pressKey(...nutModifs, nutKey)
          await nut.keyboard.releaseKey(...nutModifs, nutKey)
        } else {
          await nut.keyboard.pressKey(...nutModifs, nutKey)
          await nut.keyboard.releaseKey(...nutModifs, nutKey)
        }
      } else {
        if (found.doubletap === true) {
          await nut.keyboard.pressKey(nutKey)
          await nut.keyboard.releaseKey(nutKey)
          await nut.keyboard.pressKey(nutKey)
          await nut.keyboard.releaseKey(nutKey)
        } else {
          await nut.keyboard.pressKey(nutKey)
          await nut.keyboard.releaseKey(nutKey)
        }
      }
    } catch (error) {
      console.log(error);
    }
  }
}
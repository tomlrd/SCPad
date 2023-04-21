const { app, BrowserWindow, BrowserView, ipcMain, dialog } = require("electron");
const os = require("os")
const path = require("path");
const ejse = require('ejs-electron')
const express = require("express");
const eapp = require('express')();
const server = require('http').createServer(eapp);
const io = require('socket.io')(server);
var sender = require('node-key-sender');
const binding = require('./contexts/binding')

let mainWin, loaderView;
//sender.sendKey("right_control");

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
  console.log(dataserv);
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
      let found = dataserv.bindings.find(bind => {
        // last check
        return bind.name === keyname
      });
      if (found) {
        console.log(found.keys);
        found.keys.length > 0 ? sender.sendCombination(found.keys) : sender.sendKey(found.keys[0]);
      }
    });
  });
  server.listen(3004);
}
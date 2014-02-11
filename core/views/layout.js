var App = {Funcs:{},Collection:{},Modal:{},Model:{},View:{Panel:{Stat:{}}}};
App.Config = {
  UpdateDelay: 5000,
  UpdateDelayLong: 60000,

  Bandwidth: {
    download: {bg: '#b3d6f5', border: '#3071a9'},
    upload: {bg: '#fae2c0', border: '#ec971f'}
  },
  CPU: {
    System: {bg: '#b3d6f5', border: '#3071a9'},
    User: {bg: '#cbebf5', border: '#31b0d5'},
    'IO Wait': {bg: '#fae2c0', border: '#ec971f'}
  },
  Memory: {
    buffer: {bg: '#fae2c0', border: '#ec971f'},
    cache: {bg: '#b3d6f5', border: '#3071a9'},
    used: {bg: '#cbebf5', border: '#31b0d5'}
  }
};

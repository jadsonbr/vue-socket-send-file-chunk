// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from "vue";
import App from "./App";
import VueSocketio from "vue-socket.io";
import "vuetify/dist/vuetify.min.css";
import Vuetify from "vuetify";

Vue.config.productionTip = false;
Vue.use(VueSocketio, "http://127.0.0.1:5000");
Vue.use(Vuetify);

/* eslint-disable no-new */
new Vue({
  el: "#app",
  components: { App },
  template: "<App/>"
});

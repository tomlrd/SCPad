var APPDATAS = {}
var renderOptions;
window.addEventListener("DOMContentLoaded", async () => {
    APPDATAS = await api.appdatas()
    setTimeout(() => {
        api.send("loading", false)
    }, 1000);

    renderOptions = function name() {
        $('#Options').css('display','flex')
    }
});
var APPDATAS = {}
var renderOptions;
window.addEventListener("DOMContentLoaded", async () => {
    APPDATAS = await api.appdatas()

    renderOptions = function name() {
        if ($('#Options').css('display') === 'flex') {
            $('#Options').css('display','none')
            $('#btnoptions').text('Options')
            $('#runServ').css('display','flex')
        } else {
            $('#Options').css('display','flex')
            $('#btnoptions').text('Back')
            $('#runServ').css('display','none')
        }
    }
});
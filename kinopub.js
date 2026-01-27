(function () {
    'use strict';

    function KinopubAPI(component, _object) {
        var network = new Lampa.Reguest();
        var kp_token = Lampa.Storage.get('kp_auth_token', '');

        this.openAuth = function() {
            var modal = $('<div><div class="broadcast__text" style="text-align:center">Введите код на сайте <span style="color:#ffeb3b">kino.pub/device</span></div><div class="broadcast__device selector" style="text-align: center; background-color: #353535; color: #fff; font-size: 2em; padding: 10px; margin-top: 10px; border-radius: 5px;">ОЖИДАНИЕ...</div></div>');
            
            Lampa.Modal.open({
                title: 'Авторизация Kinopub',
                html: modal,
                onBack: function() {
                    Lampa.Modal.close();
                    Lampa.Controller.toggle('content');
                }
            });

            // Запрос кода
            network.quiet('https://api.service.it/oauth2/device', function(found) {
                if (found && found.code) {
                    modal.find('.broadcast__device').text(found.code);
                }
            }, function() {
                Lampa.Noty.show('Ошибка подключения к API');
            });
        };

        this.search = function(object, query) {
            this.openAuth();
            component.loading(false);
        };
    }

    function startPlugin() {
        // Регистрация компонента
        Lampa.Component.add('kinopub_plugin', KinopubAPI);

        // Инъекция в список источников (правая колонка Источник)
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var sources = e.data.helper.sources || [];
                var hasKP = sources.find(function(s){ return s.name == 'kinopub_plugin' });
                
                if(!hasKP) {
                    sources.push({
                        title: 'Kinopub Код',
                        name: 'kinopub_plugin',
                        full_name: 'Kinopub',
                        icon: '<svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg"><path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z" fill="white"/></svg>'
                    });
                }
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Events.on('app:ready', startPlugin);
})();
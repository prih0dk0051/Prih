(function () {
    'use strict';

    function KinopubAPI(component, _object) {
        var network = new Lampa.Reguest();
        var kp_token = Lampa.Storage.get('kp_auth_token', '');
        var object = _object;

        // 1. Логика авторизации (если токена нет)
        this.openAuth = function() {
            var modal = $('<div><div class="broadcast__text" style="text-align:center">Введите код на сайте <span style="color:#ffeb3b">kino.pub/device</span></div><div class="broadcast__device selector" style="text-align: center; background-color: #353535; color: #fff; font-size: 2em; padding: 10px; margin-top: 10px;">ОЖИДАНИЕ...</div></div>');
            
            Lampa.Modal.open({
                title: 'Авторизация Kinopub',
                html: modal,
                onBack: function() {
                    Lampa.Modal.close();
                    Lampa.Controller.toggle('content');
                }
            });

            network.quiet('https://api.service.it/oauth2/device', function(found) {
                if (found && found.code) {
                    modal.find('.broadcast__device').text(found.code);
                    // Здесь можно добавить setInterval для проверки статуса, как в Filmix
                }
            }, function() {
                Lampa.Noty.show('Ошибка подключения к API');
            });
        };

        // 2. Метод поиска (обязателен для отображения в списке источников)
        this.search = function(object, query) {
            if (!kp_token) {
                this.openAuth();
                component.loading(false);
            } else {
                // Если авторизован, можно выводить список файлов
                component.empty(); // Пока просто очищаем, так как нужен только код
            }
        };
    }

    // Регистрация плагина в системе Lampa
    function startPlugin() {
        // Добавляем плагин в список доступных источников
        Lampa.Component.add('kinopub_plugin', KinopubAPI);

        // Слушатель: когда открывается карточка фильма, добавляем наш источник в список
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') { // Когда данные карточки загружены
                var sources = e.data.helper.sources || [];
                
                // Добавляем Kinopub в массив источников
                sources.push({
                    title: 'Kinopub Код',
                    name: 'kinopub_plugin',
                    full_name: 'Kinopub',
                    icon: 'https://kino.pub/favicon.ico'
                });
            }
        });
        
        // Дополнительно: добавляем в основное меню настроек
        Lampa.SettingsApi.add({
            title: 'Kinopub Код',
            component: 'kinopub_plugin',
            icon: '<svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" fill="white"/></svg>',
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Events.on('app:ready', startPlugin);
})();
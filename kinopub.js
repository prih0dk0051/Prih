(function () {
    'use strict';

    // Основная логика плагина
    function KinopubPlugin(component, _object) {
        var network = new Lampa.Reguest();

        // Функция поиска (срабатывает при нажатии на кнопку в Источниках)
        this.search = function(object, query) {
            this.openAuth();
            component.loading(false); // Убираем индикатор загрузки
        };

        // Окно авторизации
        this.openAuth = function() {
            var modal = $('<div><div class="broadcast__text" style="text-align:center;padding:20px;">Введите код на сайте <span style="color:#ffeb3b">kino.pub/device</span></div><div class="broadcast__device selector" style="text-align: center; background-color: #353535; color: #fff; font-size: 2.5em; padding: 15px; margin-top: 10px; border-radius: 10px;">ЗАГРУЗКА...</div></div>');
            
            Lampa.Modal.open({
                title: 'Авторизация Kinopub',
                html: modal,
                onBack: function() {
                    Lampa.Modal.close();
                    Lampa.Controller.toggle('content');
                }
            });

            // Запрос кода (API Kinopub)
            network.quiet('https://api.service.it/oauth2/device', function(found) {
                if (found && found.code) {
                    modal.find('.broadcast__device').text(found.code);
                }
            }, function() {
                modal.find('.broadcast__device').text('ОШИБКА');
            });
        };
    }

    // Инициализация плагина
    function startPlugin() {
        // Регистрируем имя компонента
        Lampa.Component.add('kp_plugin', KinopubPlugin);

        // КРИТИЧЕСКИЙ БЛОК: Добавление в меню "Источник"
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var sources = e.data.helper.sources || [];
                
                // Проверяем, нет ли уже такого источника
                var hasKP = sources.find(function(s) { return s.name == 'kp_plugin' });
                
                if (!hasKP) {
                    sources.push({
                        title: 'Kinopub Код',
                        name: 'kp_plugin',
                        full_name: 'Kinopub',
                        icon: '<svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" fill="white"/></svg>'
                    });
                }
            }
        });
    }

    // Запуск при готовности приложения
    if (window.appready) startPlugin();
    else Lampa.Events.on('app:ready', startPlugin);
})();
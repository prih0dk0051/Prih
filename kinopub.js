(function () {
    'use strict';

    // Текстовые константы в Unicode, чтобы избежать проблем с кодировкой
    var L = {
        title: '\u041a\u0438\u043d\u043e\u043f\u0430\u0431 \u041a\u043e\u0434', // Кинопаб Код
        wait: '\u041e\u0436\u0438\u0434\u0430\u043d\u0438\u0435 \u043a\u043e\u0434\u0430...', // Ожидание кода...
        inst: '\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043a\u043e\u0434 \u043d\u0430 \u0441\u0430\u0439\u0442\u0435 kino.pub/device', // Инструкция
        error: '\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u0435\u0442\u0438' // Ошибка сети
    };

    function KinopubAPI(component, _object) {
        var network = new Lampa.Reguest();
        var kp_token = Lampa.Storage.get('kp_auth_token', '');
        var ping_auth;

        if (!kp_token) {
            var modal = $('<div><div class="broadcast__text">' + L.inst + '</div><div class="broadcast__device selector" style="text-align: center; background-color: #353535; color: #ffeb3b; font-size: 2em; padding: 10px; border-radius: 5px; margin-top: 10px;">' + L.wait + '</div></div>');

            this.openAuth = function() {
                Lampa.Modal.open({
                    title: L.title,
                    html: modal,
                    onBack: function() {
                        Lampa.Modal.close();
                        clearInterval(ping_auth);
                    }
                });

                // Запрос кода у Kinopub (API OAuth2)
                network.quiet('https://api.service.it/oauth2/device', function(found) {
                    if (found && found.code) {
                        modal.find('.broadcast__device').text(found.code);
                        
                        // Пингуем проверку авторизации
                        ping_auth = setInterval(function() {
                            network.silent('https://api.service.it/oauth2/token?code=' + found.code, function(res) {
                                if (res && res.access_token) {
                                    Lampa.Storage.set('kp_auth_token', res.access_token);
                                    Lampa.Modal.close();
                                    clearInterval(ping_auth);
                                    window.location.reload();
                                }
                            });
                        }, 5000);
                    }
                }, function() {
                    Lampa.Noty.show(L.error);
                });
            };

            this.openAuth();
            component.loading(false);
            return;
        }

        // Если токен есть, здесь могла бы быть логика поиска файлов, 
        // но по твоему запросу плагин должен просто давать доступ к авторизации.
        this.search = function(object) {
            component.loading(false);
            Lampa.Noty.show('\u0423\u0441\u0442\u0440\u043e\u0439\u0441\u0442\u0432\u043e \u0430\u043a\u0442\u0438\u0432\u0438\u0440\u043e\u0432\u0430\u043d\u043e'); // Устройство активировано
        };
    }

    // Регистрация плагина как компонента источника
    function startPlugin() {
        Lampa.Component.add('kinopub_source', KinopubAPI);
        
        // Добавляем в настройки для удобства
        Lampa.SettingsApi.add({
            title: L.title,
            component: 'kinopub_source',
            icon: '<svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" fill="white"/></svg>'
        });

        // Слушатель для отображения в карточке (кнопка "Онлайн")
        Lampa.Listener.follow('app', function (e) {
            if (e.type == 'ready' && Lampa.Activity.current().component == 'full') {
                var footer = $('.full-start__buttons');
                if (footer.length && !footer.find('.view--kp').length) {
                    var btn = $('<div class="full-start__button selector view--kp"><svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg" style="fill: #fff; margin-right: 10px;"><path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"/></svg><span>' + L.title + '</span></div>');
                    
                    btn.on('hover:enter', function() {
                        Lampa.Activity.push({
                            url: '',
                            title: L.title,
                            component: 'kinopub_source',
                            movie: Lampa.Activity.current().movie,
                            page: 1
                        });
                    });
                    
                    footer.append(btn);
                    Lampa.Controller.set('full');
                }
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Events.on('app:ready', startPlugin);

})();
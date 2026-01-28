(function () {
    'use strict';

    // 1. Создаем компонент Kinopub
    function KinopubComponent(component, _object) {
        this.search = function(object, query) {
            // Создаем окно с кодом
            var modal = $('<div><div style="text-align:center;padding:20px;">Введите код на <b>kino.pub/device</b></div><div class="selector" style="text-align: center; background-color: #353535; color: #ffeb3b; font-size: 3em; padding: 10px; border-radius: 10px; border: 2px solid #fff;">A1B2C3</div></div>');
            
            Lampa.Modal.open({
                title: 'Авторизация Kinopub',
                html: modal,
                onBack: function() {
                    Lampa.Modal.close();
                    Lampa.Controller.toggle('content');
                }
            });
            
            // Убираем индикатор загрузки в Lampa
            component.loading(false);
        };
    }

    // 2. Функция инициализации
    function start() {
        // Добавляем компонент в реестр Lampa
        Lampa.Component.add('kinopub_source', KinopubComponent);

        // Внедряем кнопку в правую колонку "Источник"
        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var sources = e.data.helper.sources || [];
                
                // Проверяем, нет ли уже такого источника в списке
                if (!sources.find(function(s) { return s.name == 'kinopub_source' })) {
                    sources.push({
                        title: 'Kinopub Код',
                        name: 'kinopub_source',
                        full_name: 'Kinopub',
                        icon: '<svg height="36" viewBox="0 0 24 24" width="36" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" fill="white"/></svg>'
                    });
                }
            }
        });
    }

    // 3. Запуск при готовности приложения
    if (window.appready) start();
    else Lampa.Events.on('app:ready', start);
})();
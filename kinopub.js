(function () {
    'use strict';

    function Kinopub(object) {
        var network = new Lampa.Reguest();
        var scroll  = new Lampa.Scroll({mask: true, over: true});
        var files   = new Lampa.Explorer(object);
        var search_title = object.movie.title || object.movie.name;
        
        // ВАШ ТОКЕН
        var KP_TOKEN = "00ocvi9flomjl03soaffm3xe81w5t23q";

        this.create = function () {
            var _this = this;
            this.activity.loader(true);

            // Поиск по API
            network.silent('https://api.kino.pub/v1/items/search?q=' + encodeURIComponent(search_title) + '&access_token=' + KP_TOKEN, function (found) {
                _this.activity.loader(false);
                if (found && found.items && found.items.length > 0) {
                    _this.build(found.items[0].id);
                } else {
                    _this.empty();
                }
            }, function () {
                _this.activity.loader(false);
                _this.empty();
            });

            return files.render();
        };

        this.build = function (id) {
            var _this = this;
            network.silent('https://api.kino.pub/v1/items/' + id + '?access_token=' + KP_TOKEN, function (data) {
                if (data && data.item) {
                    var items = [];
                    // Простая логика: если есть сезоны — берем серии, если нет — видео
                    var videos = data.item.videos || (data.item.seasons ? data.item.seasons[0].episodes : []);
                    
                    videos.forEach(function (v) {
                        items.push({
                            title: v.title || data.item.title,
                            quality: '720p / 1080p',
                            file: v.files && v.files[0] ? v.files[0].url.hls || v.files[0].url.http : '',
                            info: data.item.year
                        });
                    });

                    _this.display(items);
                }
            });
        };

        this.display = function (items) {
            var _this = this;
            files.appendFiles(scroll.render());
            items.forEach(function (item) {
                var html = Lampa.Template.get('online_prestige_full', item);
                html.on('hover:enter', function () {
                    if (item.file) {
                        Lampa.Player.play({ url: item.file, title: item.title });
                    } else {
                        Lampa.Noty.show("Ссылка не найдена");
                    }
                });
                scroll.append(html);
            });
            this.activity.toggle();
        };

        this.empty = function () {
            files.appendFiles(scroll.render());
            scroll.append(Lampa.Template.get('empty'));
            this.activity.toggle();
        };
    }

    function startPlugin() {
        Lampa.Component.add('kinopub_mod', Kinopub);

        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var source = {
                    title: 'KinoPub VIP',
                    name: 'kinopub_mod',
                    full_name: 'KinoPub'
                };
                if (e.data.helper) e.data.helper.sources.push(source);
            }
        });
    }

    if (window.appready) startPlugin();
    else Lampa.Events.on('app:ready', startPlugin);
})();
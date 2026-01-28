(function () {
    'use strict';

    // Твой статический токен
    var KP_TOKEN = "00ocvi9flomjl03soaffm3xe81w5t23q";
    var API_URL = 'https://api.kino.pub/v1/';

    function KinopubAPI(component, _object) {
        var network = new Lampa.Reguest();
        var object = _object;
        var select_title = '';

        this.search = function (_object) {
            object = _object;
            select_title = object.movie.title || object.movie.name;
            this.find();
        };

        this.find = function () {
            var _this = this;
            // Поиск предмета по названию
            var url = API_URL + 'items/search?q=' + encodeURIComponent(select_title) + '&access_token=' + KP_TOKEN;

            network.silent(url, function (found) {
                if (found && found.items && found.items.length > 0) {
                    // Ищем максимально подходящий по году или берем первый
                    var year = (object.movie.release_date || object.movie.first_air_date || '').slice(0, 4);
                    var exact = found.items.find(function(i) { return i.year == year; }) || found.items[0];
                    
                    _this.getItemDetails(exact.id);
                } else {
                    component.loading(false);
                    component.emptyForQuery(select_title);
                }
            }, function (a, c) {
                component.loading(false);
                component.empty(network.errorDecode(a, c));
            });
        };

        this.getItemDetails = function (id) {
            var _this = this;
            var url = API_URL + 'items/' + id + '?access_token=' + KP_TOKEN;
            
            network.silent(url, function (data) {
                component.loading(false);
                if (data && data.item) {
                    _this.buildList(data.item);
                } else {
                    component.empty();
                }
            });
        };

        this.buildList = function (item) {
            var filtred = [];

            // Если это сериал (есть сезоны)
            if (item.seasons) {
                item.seasons.forEach(function (season) {
                    season.episodes.forEach(function (episode) {
                        filtred.push({
                            title: 'S' + season.number + ' / Серия ' + episode.number + (episode.title ? ' - ' + episode.title : ''),
                            quality: 'FullHD / 4K',
                            file: episode.files[0].url.hls || episode.files[0].url.http, // Берем первую ссылку
                            info: 'Сезон ' + season.number,
                            img: episode.snapshot
                        });
                    });
                });
            } 
            // Если это фильм
            else if (item.videos) {
                item.videos.forEach(function (v) {
                    filtred.push({
                        title: item.title,
                        quality: v.files[0].quality,
                        file: v.files[0].url.hls || v.files[0].url.http,
                        info: item.year,
                        img: item.posters.medium
                    });
                });
            }

            this.append(filtred);
        };

        this.append = function (items) {
            component.reset();
            component.draw(items, {
                onEnter: function (item) {
                    Lampa.Player.play({
                        url: item.file,
                        title: item.title
                    });
                }
            });
        };

        this.destroy = function () {
            network.clear();
        };
    }

    function init() {
        Lampa.Component.add('kp_mod', function (object) {
            var scroll = new Lampa.Scroll({ mask: true, over: true });
            var files = new Lampa.Explorer(object);
            var source = new KinopubAPI(this, object);

            this.initialize = function () {
                files.appendFiles(scroll.render());
                this.search();
            };

            this.search = function () {
                this.activity.loader(true);
                source.search(object);
            };

            this.draw = function (items, params) {
                this.activity.loader(false);
                var _this = this;
                items.forEach(function (element) {
                    // Используем престиж-шаблон (карточка с картинкой)
                    var html = Lampa.Template.get('online_prestige_full', element);
                    if (element.img) html.find('img').attr('src', element.img);
                    
                    html.on('hover:enter', function () { params.onEnter(element); });
                    scroll.append(html);
                });
            };

            this.reset = function () { scroll.clear(); };
            this.render = function () { return files.render(); };
            this.destroy = function () { scroll.destroy(); source.destroy(); };
        });

        Lampa.Listener.follow('full', function (e) {
            if (e.type == 'complite') {
                var sources = e.data.helper.sources || [];
                sources.push({
                    title: 'Kinopub VIP',
                    name: 'kp_mod',
                    full_name: 'Kinopub'
                });
            }
        });
    }

    if (window.appready) init();
    else Lampa.Events.on('app:ready', init);
})();
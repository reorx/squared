(function(window) {
    var console = window.console,
        current_mode,
        support_modes = [9];


    var squared_box = $('.squared-box'),
        squared_box_dom = $('.squared-box')[0];

    var adjustSquaredHeight = function() {
        squared_box.height(squared_box.width());
    };

    var setGridMode = function(number) {
        if (support_modes.indexOf(number) === -1) {
            alert('Not supported yet');
            current_mode = undefined;
            return;
        }

        squared_box.addClass('-grids-' + number);

        current_mode = {
            number: number
        };
    };


    // Playlist functions
    var renderPlaylist = function(url) {
        var $playlist = $('.play-list'),
            $placeholder = $playlist.find('.placeholder'),
            $loading = $playlist.find('.loading'),
            $content = $playlist.find('ul'),
            $statusbar = $('.status-bar');

        $placeholder.hide();
        $content.hide();
        $loading.show().css('display', 'flex');
        fetchPlaylist(url).then(function(json) {
            _renderPlaylist(json, $content, $statusbar);

            $loading.hide();
            $content.show();
        });
    };

    var playlist_template = Handlebars.compile($('#playlist-template').html());

    var _renderPlaylist = function(json, container, statusbar) {
        statusbar.html('Total: ' + json.length + ' songs');
        var rendered = $(playlist_template({playlist: json}));

        container.html(rendered);
        // playlist sortable
        container.find('li').each(function() {
            Sortable.create(this, {
                group: {
                    name: 'default',
                    pull: 'clone',
                    put: false,
                },
                onMove: function (e) {
                    if (e.to === squared_box_dom) {
                        if (squared_box_dom.childNodes.length >= 9) {
                            console.log('full');
                            return false;
                        }
                    }
                },
                draggable: '.grid-item',
                animation: 150,
            });
        });
    };

    var fetchPlaylist = function(url) {
        return $.ajax({
            url: '/api/get_spotify_playlist',
            type: 'POST',
            data: {
                playlist_url: url
            }
        });
    };


    // canvas download


    $(function() {
        $(window).on('resize', function() {
            adjustSquaredHeight();
        });
        $(window).trigger('resize');


        // Bind grid box
        var squared_box = $('.squared-box'),
            squared_box_dom = $('.squared-box')[0];
        Sortable.create(squared_box_dom, {
            group: {
                name: 'default',
                pull: false,
            },
            animation: 200,
            filter: '.close',
        });
        squared_box.on('click',  '.close', function(e) {
            $(e.target).closest('.grid-item').remove();
        });

        // Set grid mode, use select to support more later
        setGridMode(9);


        // Bind url-box
        var url_box = $('.url-box');
        url_box.find('input').on('change', function() {
            // console.log('changed', this.value);
            var url = this.value;
            if (!url)
                return;
            renderPlaylist(url);
        });

    });

})(window);

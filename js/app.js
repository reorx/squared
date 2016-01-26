(function(window) {
    var console = window.console;

    $(function() {
        console.log('app.js');

        var squared_box = $('.squared-box'),
            squared_box_dom = $('.squared-box')[0];
        squared_box.height(squared_box.width());

        // use 9 grids
        squared_box.addClass('-grids-9');
        squared_box.on('click',  '.close', function(e) {
            $(e.target).closest('.grid-item').remove();
        });
        Sortable.create(squared_box_dom, {
            group: {
                name: 'default',
                pull: false,
            },
            animation: 200,
            filter: '.close',
        });


        var playlist_template = Handlebars.compile($('#playlist-template').html());

        var renderPlaylist = function(json) {
            var $playlist = $('.play-list'),
                rendered = $(playlist_template({playlist: json}));

            $playlist.html(rendered);
            // playlist sortable
            $playlist.find('li').each(function() {
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

            // Bind sortable
        };


        // Bind url-box
        var url_box = $('.url-box');
        url_box.find('input').on('change', function() {
            console.log('changed', this.value);
            var url = this.value;
            if (!url)
                return;

            $.ajax({
                url: '/api/get_spotify_playlist',
                type: 'POST',
                data: {
                    playlist_url: url
                },
                success: function(json) {
                    renderPlaylist(json);
                }
            });
        });

    });

})(window);

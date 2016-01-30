(function(window) {
    var console = window.console,
        current_mode,
        support_modes = [9],
        SPOTIFY_IMAGE_WIDTH = 640;


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
            grid_number: number
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

        // playlist clickable
        container.on('click', 'li .grid-item', function(e) {
            console.log('click grid item', this, e.target);
            var grid_item = $(e.target).closest('.grid-item');
            grid_item.clone().appendTo(squared_box);
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
    // XXX ensure every image is loaded
    var drawGridCanvas = function(grid_number, image_width, images) {
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            sqrt = Math.sqrt(grid_number);
        // adjust size
        canvas.width = image_width * sqrt;
        canvas.height = image_width * sqrt;
        // set background
        ctx.fillStyle = '#eee';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var drawGrid = function(img, seq) {
            var x = (seq % 3) * image_width,
                y = Math.floor((seq / 3)) * image_width;
            ctx.drawImage(img, x, y, image_width, image_width);
        };

        // draw each image
        images.each(function(i, img) {
            drawGrid(img, i);
        });
        return canvas;
    };

    var downloadCanvasImage = function(canvas, filename, size) {
        var a = document.createElement('a'),
            class_name = '_canvas-downloader',
            resized_canvas;
        $('.' + class_name).remove();

        // resize
        if (size === undefined) {
            size = SPOTIFY_IMAGE_WIDTH * 3;
        }
        if (canvas.width === size) {
            console.log('no need to resize');
            resized_canvas = canvas;
        } else {
            resized_canvas = document.createElement('canvas');
            resized_canvas.width = size;
            resized_canvas.height = size;
            var rctx = resized_canvas.getContext('2d');
            rctx.drawImage(canvas,
                0, 0, canvas.width, canvas.height,
                0, 0, resized_canvas.width, resized_canvas.height);
        }

        a.href = resized_canvas.toDataURL('image/jpeg', 1.0);
        a.download = filename + '-' + size + 'X' + size + '.jpeg';
        a.className = class_name;
        document.body.appendChild(a);
        a.click();
    };


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


        // Bind settings box
        var settings_box = $('.settings-box');

        settings_box.find('.download').on('click', function() {
            var images = squared_box.find('.grid-item > img'),
                size = settings_box.find('select[name=size]').val();
            if (size === 'origin') {
                size = undefined;
            } else {
                size = Number(size);
            }
            console.log('download size', size);
            if (!images.length) {
                alert('Please select at least one image in the grid box');
                return;
            }
            // var image_width = images[0].width;
            var image_width = SPOTIFY_IMAGE_WIDTH;
            var canvas = drawGridCanvas(current_mode.grid_number, image_width, images);
            downloadCanvasImage(canvas, 'artwork', size);
        });


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

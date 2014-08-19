/*!
 * jQuery Cache Images
 * Plugin for jQuery that allows for the easy caching of image files in the browsers LocalStorage.
 * Can be bound elements or parents.
 *
 *
 * @author Paul Prins
 * @link http://paulprins.net
 * @version 1.0
 * @requires jQuery v1.7 or later
 *
 * Official jQuery plugin page: 
 * Find source on GitHub: https://github.com/FreshVine/jQuery-cache-image
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
(function ($) {
	$.fn.cacheImages = function (opts) {
		// Set the defaults
		window.cacheImagesConfig = $.extend({}, {
			debug: false,	// Boolean value to enable or disable some of the console messaging for trouble shooting
			defaultImage: 'data:image/png;base64,/9j/4AAQSkZJRgABAgAAZABkAAD/7AARRHVja3kAAQAEAAAAHgAA/+4ADkFkb2JlAGTAAAAAAf/bAIQAEAsLCwwLEAwMEBcPDQ8XGxQQEBQbHxcXFxcXHx4XGhoaGhceHiMlJyUjHi8vMzMvL0BAQEBAQEBAQEBAQEBAQAERDw8RExEVEhIVFBEUERQaFBYWFBomGhocGhomMCMeHh4eIzArLicnJy4rNTUwMDU1QEA/QEBAQEBAQEBAQEBA/8AAEQgAZABkAwEiAAIRAQMRAf/EAEsAAQEAAAAAAAAAAAAAAAAAAAAFAQEAAAAAAAAAAAAAAAAAAAAAEAEAAAAAAAAAAAAAAAAAAAAAEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//2Q==',	// URL or base64 string for the default image (will obviously get cached) - default is at assets/default.jpg
			encodeOnCanvas: false,	// This is still experimental and should be disabled in production
			storagePrefix: 'cached',	// Used to prefix the URL in at localStorage key
			url: null	// Allows you to directly set the url for an element
			}, opts);

		// Check for canvas support
		window.cacheImagesConfig.encodeOnCanvas = typeof HTMLCanvasElement != undefined ? window.cacheImagesConfig.encodeOnCanvas : false;

		var self = this;


		/*
		 * Ensure we have the default image cached and ready for use
		 */
		if( /^data:image/.test( window.cacheImagesConfig.defaultImage ) === false ){
			window.cacheImagesConfig.defaultSrc = window.cacheImagesConfig.defaultImage;
		}


		/*
		 *	Takes the image and uses a canvas element to encode the media
		 *	response | string | this is the raw XHR resposne data
		 *	filename | string | this is the url accessed/filename, it's needed so that we can parse out the type of image for mimetyping
		 *	Code base heavily on Encoding XHR image data by @mathias - http://jsperf.com/encoding-xhr-image-data/33
		 */
		var base64EncodeCanvas = function( img ){
			try {
				var canvas = document.createElement('canvas');
				canvas.width = img.width;
				canvas.height = img.height;

				var ctx = canvas.getContext('2d');
				ctx.drawImage(img, 0, 0);

				var imgType = img.src.match(/\.(jpg|jpeg|png)$/i);
				if( imgType && imgType.length ) {
					imgType = imgType[1].toLowerCase() == 'jpg' ? 'jpeg' : imgType[1].toLowerCase();
				} else {
					throw 'Invalid image type for canvas encoder: ' + img.src;
				}

				return canvas.toDataURL('image/' + imgType);
			} catch (e) {
				console && console.log(e);
				return 'error';
			}
		};

		/*
		 *	Takes raw image data, and outputs a base64 encoded image data string for local storage caching
		 *	response | string | this is the raw XHR resposne data
		 *	filename | string | this is the url accessed/filename, it's needed so that we can parse out the type of image for mimetyping
		 *	Code base heavily on Encoding XHR image data by @mathias - http://jsperf.com/encoding-xhr-image-data/33
		 */
	    var base64EncodeResponse = function( raw ){
			var base64 = '',
				encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
				bytes = new Uint8Array(raw),
				byteLength = bytes.byteLength,
				byteRemainder = byteLength % 3,
				mainLength = byteLength - byteRemainder,
				a, b, c, d, chunk;

			// Main loop deals with bytes in chunks of 3
			for( var i = 0; i < mainLength; i = i + 3 ){
				// Combine the three bytes into a single integer
				chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
				// Use bitmasks to extract 6-bit segments from the triplet
				a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
				b = (chunk & 258048) >> 12; // 258048 = (2^6 - 1) << 12
				c = (chunk & 4032) >> 6; // 4032 = (2^6 - 1) << 6
				d = chunk & 63; // 63 = 2^6 - 1
				// Convert the raw binary segments to the appropriate ASCII encoding
				base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
			}

			// Deal with the remaining bytes and padding
			if( byteRemainder === 1 ){
				chunk = bytes[mainLength];
				a = (chunk & 252) >> 2 // 252 = (2^6 - 1) << 2;
				// Set the 4 least significant bits to zero
				b = (chunk & 3) << 4 // 3 = 2^2 - 1;
				base64 += encodings[a] + encodings[b] + '==';
			}
			else if( byteRemainder === 2 ) {
				chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
				a = (chunk & 16128) >> 8 // 16128 = (2^6 - 1) << 8;
				b = (chunk & 1008) >> 4 // 1008 = (2^6 - 1) << 4;
				// Set the 2 least significant bits to zero
				c = (chunk & 15) << 2 // 15 = 2^4 - 1;
				base64 += encodings[a] + encodings[b] + encodings[c] + '=';
			}

		   return base64;
	    };

		/*
		 * Here is the magic, this is the function that processes through the caching of the images
		 */ 
		$(function () {
			// console.log( $(self) );
			$(self).each(function (i, img) {
				var $this = $(img),
					src = $this.prop('src') || $this.data('cachedImageSrc');
				if( window.cacheImagesConfig.url !== null ){	// URL set in the opts
					src = window.cacheImagesConfig.url;
					$this.prop('src', '');
				}

				var	key = window.cacheImagesConfig.storagePrefix + ':' + src,	// Prepare the localStorage key
					localSrcEncoded = localStorage[key];

				if( typeof localStorage !== "object" ){	// See if local storage is working
					if( window.cacheImagesConfig.debug ){ console.log("localStorage is not available"); }
					return false;	// Unable to cache, so stop looping
				}

				if( typeof src === 'undefined' ){ return true; }	// Move to the next item
				if( typeof $this.prop('src') !== 'undefined' && $this.prop('src').substring(0,5) === 'data:' ){ return true; }	// This has already been converted

				

				if( localSrcEncoded && /^data:image/.test( localSrcEncoded ) ) {
					// Check if the image has already been cached, if it has lets bounce out of here
					$this.data('cachedImageSrc', src);
					$this.prop('src', localSrcEncoded);
				}else{
					// The image has not yet been cached, so we need to get on that.
					$this.prop('src', '');	// This will cancel the request if it hasn't already been finished
					var imgType = src.match(/\.(jpg|jpeg|png|gif)$/i);	// Break out the filename to get the type
					if( imgType && imgType.length){	// Get us the type of file
						imgType = imgType[1].toLowerCase() == 'jpg' ? 'jpeg' : imgType[1].toLowerCase();
					}
					if( typeof imgType === 'undefined' ){ return true; }


					if( localStorage[key] !== 'pending' ){
						localStorage[key] = 'pending';
						$this.data('cachedImageSrc', src);

						if( window.cacheImagesConfig.encodeOnCanvas && imgType !== 'gif' ){
							$this.load(function () {
								localStorage[key] = src = base64EncodeCanvas( img );
								if( src.substring(0,5) === 'data:' ){
									$this.prop('src', localStorage[key] );
									if( $this.is('.cacheImagesRemove') ){
										$this.remove();
									}
								}
							});
						}else{
							var xhr = new XMLHttpRequest();
							xhr.open('GET', src, true);
							xhr.responseType = 'arraybuffer'; // Cannot use the jQuery ajax method until it support this response type
							xhr.onload = function( e ){
								if (this.status == 200 && e.totalSize > 0 ){
									localStorage[key] = 'data:image/' + imgType + ';base64,' + base64EncodeResponse( this.response );
									$this.prop('src', localStorage[key] );
									if( $this.is('.cacheImagesRemove') ){
										$this.remove();
									}
								}else{
									localStorage[key] = 'error';
									// Display the default image
									if( typeof window.cacheImagesConfig.defaultSrc !== 'undefined' ){
										var defaultKey = window.cacheImagesConfig.storagePrefix + ':' + window.cacheImagesConfig.defaultSrc;
										if( typeof localStorage[defaultKey] !== 'undefined' ){
											$this.prop('src', localStorage[defaultKey] );
										}else{
											$this.cacheImages({url: window.cacheImagesConfig.defaultSrc });	// Will cache it, and display it here
										}
									}else{
										$this.prop('src', window.cacheImagesConfig.defaultImage );
									}
								}
							};
							xhr.send();
						}
					}
				}
			});
		});

		return this;
	};
	/*
	 *	Manually cache an image into the local storage
	 */
	window.cacheImagesFetchURL = function( url ){
		$('body').append( $('<img style="display: none;" />').addClass('cacheImagesRemove').cacheImages({url: url}) );
	};
	/*
	 *	Will remove all of the cached images from their localStorage
	 */
	window.cacheImagesDrop = function(){
		var dropKeys = [];	// Store the keys we need to drop here
		// Lets get our loop on
		for (i = 0; i < window.localStorage.length; i++) {
			if( window.localStorage.key(i).substr( 0, window.cacheImagesConfig.storagePrefix.length + 1 ) !== window.cacheImagesConfig.storagePrefix + ':' ){ continue; }	// Does not match our prefix?

			dropKeys.push( window.localStorage.key(i) ); // Droping the keys here re-indexes the localStorage so that the offset in our loop is wrong
		}

		if( dropKeys.length ===  0 ){
			if( window.cacheImagesConfig.debug ){ console.log( 'No Images to Drop' ); }
			return true;
		}

		// Drop the keys we found
		for( i = 0; i < dropKeys.length; i++ ){
			if( window.cacheImagesConfig.debug ){ console.log( 'Dropping localStorage Key:', dropKeys[i] ); }	// Let them know what keys were dropped
			window.localStorage.removeItem( dropKeys[i] );
		}

		if( window.cacheImagesConfig.debug ){ console.log( 'Dropped ' + dropKeys.length + ' images from localStorage' ); }	// Provide a bit of feedback for developers
		return true;
	};
})(jQuery);
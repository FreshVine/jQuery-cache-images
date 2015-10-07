/*!
 * jQuery Cache Images
 * Plugin for jQuery that allows for the easy caching of image files in the browsers LocalStorage.
 * Can be bound elements or parents.
 *
 *
 * @author Paul Prins
 * @link http://paulprins.net
 * @version 1.6.0
 * @requires jQuery v1.7 or later
 *
 * Official jQuery plugin page: 
 * Find source on GitHub: https://github.com/FreshVine/jQuery-cache-images
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
(function ($) {
	$.fn.cacheImages = function( options ) {
		// Set the defaults
		this.cacheImagesConfig = $.extend( {}, $.fn.cacheImages.defaults, options );

		// Check for canvas support
		this.cacheImagesConfig.encodeOnCanvas = typeof HTMLCanvasElement != undefined ? this.cacheImagesConfig.encodeOnCanvas : false;

		// Check for force Save regardless of current cached state
		if( typeof this.cacheImagesConfig.forceSave == undefined ){ this.cacheImagesConfig.forceSave = false; }

		var self = this;


		/*
		 * Ensure we have the default image cached and ready for use
		 */
		if( /^data:image/.test( this.cacheImagesConfig.defaultImage ) === false ){
			this.cacheImagesConfig.defaultSrc = this.cacheImagesConfig.defaultImage;
		}


		/*
		 * Here is the magic, this is the function that processes through the caching of the images
		 */ 
		return this.each(function (i, img) {
			//
			// Check if we can actually continue with this
			$.fn.cacheImages.storageAvailable( $(img), i, img, function(i, img){
				var $this = $(img),
					src;

				if( $this.prop("tagName") === 'IMG' ){
					$this.data('cachedImageType', 'src');

					var src = $this.prop('src') || $this.data('cachedImageSrc');
					if( self.cacheImagesConfig.url !== null ){	// URL set in the opts
						src = self.cacheImagesConfig.url;
						$this.prop('src', '');
					}
				}else{
					$this.data('cachedImageType', 'css');

					var src = $this.css('background-image').replace(/"/g,"").replace(/url\(|\)$/ig, "") || $this.data('cachedImageSrc');
					if( self.cacheImagesConfig.url !== null ){	// URL set in the opts
						src = self.cacheImagesConfig.url;
						$this.css('background-image', 'url()');
					}
				}



				if( typeof src === 'undefined' ){ return true; }	// Move to the next item
				if( typeof $this.prop('src') !== 'undefined' && $this.prop('src').substring(0,5) === 'data:' ){ return true; }	// This has already been converted
				// Check if we can actually continue with this
				//

				var	key = self.cacheImagesConfig.storagePrefix + ':' + src;	// Prepare the image key
				$.fn.cacheImages.get( $this, key, function( key, localSrcEncoded ){
self.cacheImagesConfig.forceSave
					if( localSrcEncoded && /^data:image/.test( localSrcEncoded ) && self.cacheImagesConfig.forceSave == false ) {
						// Check if the image has already been cached, if it has lets bounce out of here
						this.data('cachedImageSrc', src);
						if( this.data('cachedImageType') == 'src' ){
							this.prop('src', localSrcEncoded );
						}else{
							this.css('background-image', 'url(' + localSrcEncoded + ')')
						}

						self.cacheImagesConfig.done.call( this, localSrcEncoded );
						self.cacheImagesConfig.always.call( this );
						return;
					}else if( localSrcEncoded === 'pending' ){
						// This is either not an image, or the URL is already being processed somewhere else
						self.cacheImagesConfig.fail.call( this );
						self.cacheImagesConfig.always.call( this );
						return;	// stop running
					}else{
						// The image has not yet been cached, so we need to get on that.

						if( this.data('cachedImageType') == 'src' ){	// This will cancel the request if it hasn't already been finished
							this.prop('src', '' );
						}else{
							this.css('background-image', 'url()');
						}
						var imgType = src.match(/\.(jpg|jpeg|png|gif)$/i);	// Break out the filename to get the type
						if( imgType && imgType.length){	// Get us the type of file
							imgType = imgType[1].toLowerCase() == 'jpg' ? 'jpeg' : imgType[1].toLowerCase();
						}
						if( typeof imgType === 'undefined' ){ 
							// This is either not an image, or the URL is already being processed somewhere else
							self.cacheImagesConfig.fail.call( this );
							self.cacheImagesConfig.always.call( this );
							return;	// stop running
						}


						this.data('cachedImageSrc', src);	// store the source url incase we need it in the future
						$.fn.cacheImages.set( this, key, 'pending', function( key, encodedString ){});	// Set it to pending while we fetch and process the media - will keep us from double teaming the same item

						if( self.cacheImagesConfig.encodeOnCanvas && imgType !== 'gif' ){	// For some reason animated gifs do not correctly encode on the canvas
							$this.load(function () {
								newSrc = $.fn.cacheImages.base64EncodeCanvas( img );	// Process the image
								$.fn.cacheImages.set( this, key, newSrc );	// Save the media
								if( src.substring(0,5) === 'data:' ){
									if( this.data('cachedImageType') == 'src' ){
										this.prop('src', newSrc );
									}else{
										this.css('background-image', 'url(' + newSrc + ')')
									}

									if( this.is('.cacheImagesRemove') ){
										this.remove();
									}
								}
							});
						}
						else{
							var xhr = new XMLHttpRequest(),
								thisElem = this;
							xhr.open('GET', src, true);
							xhr.responseType = 'arraybuffer'; // Cannot use the jQuery ajax method until it support this response type
							xhr.onload = function( e ){
								newSrc = '';
								if (this.status == 200 ){
									newSrc = 'data:image/' + imgType + ';base64,' + $.fn.cacheImages.base64EncodeResponse( this.response );
								}

								$.fn.cacheImages.set( thisElem, key, newSrc, function( key, encodedString ){
									// Default processing of the response
									if( encodedString.length !== 0 && encodedString !== 'data:image/' + imgType + ';base64,'){	// it appended image data
										if( this.data('cachedImageType') == 'src' ){
											this.prop('src', encodedString );
										}else{
											this.css('background-image', 'url(' + encodedString + ')')
										}

										if( this.is('.cacheImagesRemove') ){	this.remove();	}
										self.cacheImagesConfig.done.call( this, false );
										self.cacheImagesConfig.always.call( this );
										return;
									}else{
										// It did not append image data
										$.fn.cacheImages.set( this, key, 'error', function( key, encodedString ){

											// Display the default image
											if( typeof self.cacheImagesConfig.defaultSrc !== 'undefined' ){
												self.cacheImagesConfig.url = self.cacheImagesConfig.defaultImage;	// set the default if we can reach it
												this.cacheImages(self.cacheImagesConfig);	
												return; // stop progression
											}else{
												if( this.data('cachedImageType') == 'src' ){
													this.prop('src', self.cacheImagesConfig.defaultImage );
												}else{
													this.css('background-image', 'url(' + self.cacheImagesConfig.defaultImage + ')')
												}

												self.cacheImagesConfig.fail.call( this );
												self.cacheImagesConfig.always.call( this );
											}
										});	// Replace the response with an error - will attempt to re-cache the next time around
									}
								});	// Save the media
							};
							xhr.send();
						}
					}
				});	
			});
		});

		return this;
	};
	// Plugin defaults – added as a property on our plugin function.
	$.fn.cacheImages.defaults = {
		always: function(){},	// Will always be called at the end of the caching attempt
		debug: false,	// Boolean value to enable or disable some of the console messaging for trouble shooting
		defaultImage: 'data:image/png;base64,/9j/4AAQSkZJRgABAgAAZABkAAD/7AARRHVja3kAAQAEAAAAHgAA/+4ADkFkb2JlAGTAAAAAAf/bAIQAEAsLCwwLEAwMEBcPDQ8XGxQQEBQbHxcXFxcXHx4XGhoaGhceHiMlJyUjHi8vMzMvL0BAQEBAQEBAQEBAQEBAQAERDw8RExEVEhIVFBEUERQaFBYWFBomGhocGhomMCMeHh4eIzArLicnJy4rNTUwMDU1QEA/QEBAQEBAQEBAQEBA/8AAEQgAZABkAwEiAAIRAQMRAf/EAEsAAQEAAAAAAAAAAAAAAAAAAAAFAQEAAAAAAAAAAAAAAAAAAAAAEAEAAAAAAAAAAAAAAAAAAAAAEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD//2Q==',	// URL or base64 string for the default image (will obviously get cached) - default is at assets/default.jpg
		done: function( image ){},	// Call back after the image has been cached
		encodeOnCanvas: false,	// This is still experimental and should be disabled in production
		fail: function(){},	// Call back after unable to cache an image
		ready: true,	// Force the caching to wait for a ready state before processing (for storage methods requiring connections be built)
		storagePrefix: 'cached',	// Used to prefix the URL in at localStorage key
		url: null	// Allows you to directly set the url for an element
	};
	/*
	 *	Check if the client has this storage method available
	 */
	$.fn.cacheImages.storageAvailable = function(thisElem, i, img, callbackFunction){ 
		 if( typeof localStorage === "object" ){
	        callbackFunction.call( thisElem, i, img );	// This is the structure to use for our callbacks
			return;
		 }

		if( $.fn.cacheImages.defaults.debug ){ console.log('localStorage not available'); }
		return;
	 };
	/*
	 *	Saves the encoded image data into the storage tool for the provided key
	 *	key | string | the full key to use including the prefix
	 *	encodedString | string | the base 64 encoded string to assign to the key
	 */
	$.fn.cacheImages.set = function( thisElem, key, encodedString, callbackFunction ){
		localStorage[key] = encodedString;

        if( typeof callbackFunction === 'function' ){
            callbackFunction.call( thisElem, key, encodedString );	// This is the structure to use for our callbacks
        }
	};
	/*
	 *	Gets the image from the storage system. Will return false if the key does not exist
	 *	key | string | the full key to use including the prefix
	 */
	$.fn.cacheImages.get = function( thisElem, key, callbackFunction ){
		var encodedString = null;
		if( typeof localStorage[key] !== 'undefined' ){ encodedString = localStorage[key]; }

        if( typeof callbackFunction === 'function' ){
            callbackFunction.call(thisElem, key, encodedString );	// This is the structure to use for our callbacks
        }
		// return localStorage[key];
	};
	/*
	 *	Takes the image and uses a canvas element to encode the media
	 *	response | string | this is the raw XHR resposne data
	 *	filename | string | this is the url accessed/filename, it's needed so that we can parse out the type of image for mimetyping
	 *	Code base heavily on Encoding XHR image data by @mathias - http://jsperf.com/encoding-xhr-image-data/33
	 */
	$.fn.cacheImages.base64EncodeCanvas = function( img ){
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
	$.fn.cacheImages.base64EncodeResponse = function( raw ){
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
	 *	Manually cache an image into the local storage
	 */
	$.fn.cacheImages.fetchURL = function( url ){
		$('body').append( $('<img style="display: none;" />').addClass('cacheImagesRemove').cacheImages({url: url}) );
	};
	/*
	 *	Retreive the encoded string from local storage
	 */
	$.fn.cacheImages.Output = function( url, callbackFunction, storagePrefix ){
		if( typeof storagePrefix === 'undefined' ){ storagePrefix = $.fn.cacheImages.defaults.storagePrefix; }
		var tempKey = storagePrefix + ':' + url;
		if( window.localStorage.getItem( tempKey ) != null ){
			return window.localStorage.getItem( tempKey );	// Image exists in the cache
		}else{

			if( /^data:image/.test( this.cacheImagesConfig.defaultImage ) === true ){
				return this.cacheImagesConfig.defaultImage;	// this is an encoded string
			}

			tempKey = storagePrefix + ':' + this.cacheImagesConfig.defaultImage;
			if( window.localStorage.getItem( tempKey ) != null ){
		        if( typeof callbackFunction === 'function' ){
		            callbackFunction.call( thisElem, tempKey );	// This is the structure to use for our callbacks
		        }

				return window.localStorage.getItem( tempKey );	// Default URL was already cached
			}
		}

		return null;	// Neither the image or the cached version existsed
	};
	/*
	 *	Will remove all of the cached images from their localStorage
	 */
	$.fn.cacheImages.drop = function( url, callbackFunction, storagePrefix ){
		var dropKeys = [],	// Store the keys we need to drop here
			debug = false;
		if( typeof storagePrefix === 'undefined' ){ storagePrefix = $.fn.cacheImages.defaults.storagePrefix; }
		if( typeof url === 'undefined' ){ url = null; }	// DROP ALL THE THINGS

		// Lets get our loop on
		for (i = 0; i < window.localStorage.length; i++) {
			if( window.localStorage.key(i).substr( 0,storagePrefix.length + 1 ) !== storagePrefix + ':' ){ continue; }	// Does not match our prefix?
			if( url !== null && window.localStorage.key(i) !== storagePrefix + ':' + url ){ continue; }

			dropKeys.push( window.localStorage.key(i) ); // Droping the keys here re-indexes the localStorage so that the offset in our loop is wrong
		}

		if( dropKeys.length ===  0 ){
			if( $.fn.cacheImages.defaults.debug ){ console.log( 'No Images to Drop' ); }
		}else{
			// Drop the keys we found
			for( i = 0; i < dropKeys.length; i++ ){
				if( $.fn.cacheImages.defaults.debug ){ console.log( 'Dropping localStorage Key:', dropKeys[i] ); }	// Let them know what keys were dropped
				window.localStorage.removeItem( dropKeys[i] );
			}

			if( $.fn.cacheImages.defaults.debug ){ console.log( 'Dropped ' + dropKeys.length + ' images from storage' ); }	// Provide a bit of feedback for developers
		}

        if( typeof callbackFunction === 'function' ){
            callbackFunction.call( thisElem, url );	// This is the structure to use for our callbacks
        }

		return;
	};
})(jQuery);
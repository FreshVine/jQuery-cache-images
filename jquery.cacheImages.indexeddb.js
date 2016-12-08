/*!
 * jQuery Cache Images - now saucier with indexedDB
 * Modifies the storage approach of the CacheImages to utilize indexedDB for storage
 *
 * @version 1.8.0
 * Official jQuery plugin page: 
 * Find source on GitHub: https://github.com/FreshVine/jQuery-cache-image
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

	window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB; // Unify browser prefixes to maintain sanity
	$.fn.cacheImages.defaults.storageDB = 'indexedDB';	// Incase you want to check if this library is being used
	$.fn.cacheImages.defaults.ready = false;	// Ensure that we are ready to do check for a db connection to be active
	if( $.fn.cacheImages.defaults.debug ){ console.log('FV.cacheImages: Using indexedDB '); }

	/* -- Setup everything we need for the database -- */
	var cacheImagesDb;	// used to hold the db reference
	if( typeof $.fn.cacheImages.defaults.indexedDbName === 'undefined' ){ $.fn.cacheImages.defaults.indexedDbName = 'cacheImages'; }	// Needs to be defined prior to instantiating this script - but after including the primary cacheImages script
	$.fn.cacheImages.dbRequest = window.indexedDB.open( $.fn.cacheImages.defaults.indexedDbName, 1 );
	$.fn.cacheImages.defaults.indexedDbStatus = false;

	// Enable
	$.fn.cacheImages.dbRequest.onerror = function(e) {
		$.fn.cacheImages.defaults.indexedDbStatus = false;
		if( $.fn.cacheImages.defaults.debug ){ console.log("FV.cacheImages: Why didn't you allow my web app to use IndexedDB?!"); };
	};
	$.fn.cacheImages.dbRequest.onsuccess = function(e) {
		if( $.fn.cacheImages.defaults.debug ){ console.log("FV.cacheImages: IndexedDB open success. It is ready"); };
		$.fn.cacheImages.defaults.ready = $.fn.cacheImages.defaults.indexedDbStatus = true;
		window.cacheImagesDb = e.target.result;

		window.cacheImagesDb.onerror = function(e) {
		  if( $.fn.cacheImages.defaults.debug ){ console.log("IndexedDB error: " + e.target.errorCode); };
		};
	};
	//handle setup
	$.fn.cacheImages.dbRequest.onupgradeneeded = function(e) {
		if( $.fn.cacheImages.defaults.debug ){ console.log("FV.cacheImages: running onupgradeneeded"); }
		var thisDb = e.target.result;

		//Create Note
		if(!thisDb.objectStoreNames.contains("offlineImages")) {
			// Structure is key, image
			if( $.fn.cacheImages.defaults.debug ){ console.log("FV.cacheImages: making the offlineImages objectstore"); }
			var objectStore = thisDb.createObjectStore("offlineImages", { keyPath: "key" });
		    var titleIndex = objectStore.createIndex("by_key", "key", {unique: true});
		}
	};
	/* -- Setup everything we need for the database -- */


	/*
	 *	Check if the client has this storage method available
	 */
	$.fn.cacheImages.storageAvailable = function( thisElem, i, img, callbackFunction ){
		if( $.fn.cacheImages.defaults.debug ){ console.log('FV.cacheImages: indexedDB availability check'); }

		if( $.fn.cacheImages.defaults.indexedDbStatus === true ){
	        callbackFunction.call( thisElem, i, img );	// This is the structure to use for our callbacks
			if( $.fn.cacheImages.defaults.debug ){ console.log('FV.cacheImages: indexedDB already ready'); }
			return;
		}

		var intervalCount = 0,
			thisInterval = setInterval(function(){
				intervalCount++;
				if( $.fn.cacheImages.defaults.indexedDbStatus === true ){
					if( $.fn.cacheImages.defaults.debug ){ console.log('FV.cacheImages: indexedDB ready to use', 'indexedDB took ' + (intervalCount*50) + 'ms to conenct'); }
			        callbackFunction.call( thisElem, i, img );	// This is the structure to use for our callbacks
					clearInterval(thisInterval); return;
				}
				if( intervalCount >= 41 ){	// only run for 2 seconds max - if it isn't available then there are other issues at play
					if( $.fn.cacheImages.defaults.debug ){ console.log('FV.cacheImages: indexedDB did not load'); }
					clearInterval(thisInterval);
					return;
				}

				if( $.fn.cacheImages.defaults.debug ){ console.log('FV.cacheImages: indexedDB not yet available'); }
			}, 50 );
		return;
	};
	/*
	 *	Saves the encoded image data into the storage tool for the provided key
	 *	key | string | the full key to use including the prefix
	 *	encodedString | string | the base 64 encoded string to assign to the key
	 */
	$.fn.cacheImages.set = function( thisElem, key, encodedString, callbackFunction ){	
		var objectStore = window.cacheImagesDb.transaction("offlineImages", "readwrite").objectStore("offlineImages"),
			imageData = {key: key, image: encodedString},
		    request = objectStore.put( imageData );
	    request.onsuccess = function(e){
	        if( typeof callbackFunction === 'function' ){
	            callbackFunction.call( thisElem, key, encodedString );	// This is the structure to use for our callbacks
	        }
		}
		request.onerror = function(e){
			self.cacheImagesConfig.fail.call( this );
			self.cacheImagesConfig.always.call( this );
		}
	};
	/*
	 *	Gets the image from the storage system. Will return false if the key does not exist
	 *	key | string | the full key to use including the prefix
	 */
	$.fn.cacheImages.get = function( thisElem, key, callbackFunction ){
		var tmp = window.cacheImagesDb.transaction("offlineImages",'readonly').objectStore("offlineImages").get(key);
		tmp.onsuccess = function(e){
			encodedString = '';
			if( typeof e.target.result !== 'undefined' && typeof e.target.result.image === 'string' ){
				encodedString = e.target.result.image;
			}

	        if( typeof callbackFunction === 'function' ){
	            callbackFunction.call( thisElem, key, encodedString );	// This is the structure to use for our callbacks
	        }
		}
		tmp.onerror = function(e){
			self.cacheImagesConfig.fail.call( this );
			self.cacheImagesConfig.always.call( this );
		}
	};
	/*
	 *	Retreive the encoded string from local storage, passes the value to the callback function
	 */
	$.fn.cacheImages.Output = function( url, callbackFunction, storagePrefix, secondTry ){
		if( typeof storagePrefix === 'undefined' || typeof storagePrefix === 'null' ){ storagePrefix = $.fn.cacheImages.defaults.storagePrefix; }
		if( typeof secondTry !== 'boolean' ){ secondTry = false; }
		var tempKey = storagePrefix + ':' + url,
			thisElem = this;

		var request = window.cacheImagesDb.transaction("offlineImages", "readonly").objectStore("offlineImages").get( tempKey );
		request.onsuccess = function(e) {
			var image = '';

			// Lets try out this image
			if( typeof e.target.result !== 'undefined' && typeof e.target.result.image === 'string' ){
				image = e.target.result.image;
				if( $.fn.cacheImages.testOutput( image, true ) == false ){
					delete image;	// reset the variable to trigger default
					if( secondTry == false ){
						// - Force Fetch the URL again
						// - Output the new Image
						$('body').append( 
							$('<img style="display: none;" />')
								.addClass('cacheImagesRemove')
								.cacheImages({
									url: url,
									forceSave: true,
									storagePrefix: storagePrefix,
									done: function( image ){ 
										if( typeof callbackFunction == 'function' ){
											$.fn.cacheImages.Output( url, callbackFunction, storagePrefix, true );
										}
									}
							})
						);
						return;
					}
				}
			}



			//
			// Try to grab the default image
			if( $.fn.cacheImages.testOutput( image, true ) == false ){
				if( $.fn.cacheImages.defaults.debug ){ console.log( 'FV.cacheImage.Output: Failed to load image ' + url ); }
				if( $.fn.cacheImages.testOutput( $.fn.cacheImages.defaults.defaultImage, true ) ){
					image = $.fn.cacheImages.defaults.defaultImage;	// this is an encoded string
				}else{
					$.fn.cacheImages.Output( $.fn.cacheImages.defaults.defaultImage, callbackFunction, storagePrefix );	// pass the callback through
					return;
				}
			}

	        if( typeof callbackFunction === 'function' ){
	            callbackFunction.call( this, image );	// This is the structure to use for our callbacks
	        }
		}

		return null;	// Neither the image or the cached version existsed
	};
	/*
	 *	Will remove all of the cached images from their localStorage
	 */
	$.fn.cacheImages.drop = function( url, callbackFunction, storagePrefix ){
		var dropKeys = [];	// Store the keys we need to drop here
		if( typeof storagePrefix === 'undefined' ){ storagePrefix = $.fn.cacheImages.defaults.storagePrefix; }
		if( typeof url === 'undefined' ){ url = null; }	// DROP ALL THE THINGS

		var request = window.cacheImagesDb.transaction("offlineImages", "readonly").objectStore("offlineImages").openCursor();
		request.onsuccess = function(e) {
			var cursor = e.target.result;
			if (cursor) {
				// Called for each matching record.
				if( cursor.value.key.substr( 0,storagePrefix.length + 1 ) === storagePrefix + ':' ){	// Does not match our prefix?
					if( url === null || cursor.value.key === storagePrefix + ':' + url ){ 
						dropKeys.push(cursor.value.key ); // Droping the keys here re-indexes the localStorage so that the offset in our loop is wrong
					}
				}
				cursor.continue();
			}else{
				// No more matching records.
				if( $.fn.cacheImages.defaults.debug ){ console.log('FV.cacheImages.drop: No more matching records'); }

				if( dropKeys.length ===  0 ){
					if( $.fn.cacheImages.defaults.debug ){ console.log( 'FV.cacheImages.drop: No Images to Drop' ); } 
				}else{
					// Drop the keys we found
					for( i = 0; i < dropKeys.length; i++ ){
						if( $.fn.cacheImages.defaults.debug ){console.log( 'FV.cacheImages.drop: Dropping localStorage Key:', dropKeys[i] ); }	// Let them know what keys were dropped
						window.cacheImagesDb.transaction("offlineImages", "readwrite").objectStore("offlineImages").delete( dropKeys[i] );
					}

					if( $.fn.cacheImages.defaults.debug ){ console.log( 'FV.cacheImages.drop: Dropped ' + dropKeys.length + ' images from indexedDB' ); }	// Provide a bit of feedback for developers
				}

		        if( typeof callbackFunction === 'function' ){
		            callbackFunction.call( this, url );	// This is the structure to use for our callbacks
		        }
				return true;
			}
		};
	};
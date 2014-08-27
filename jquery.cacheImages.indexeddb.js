/*!
 * jQuery Cache Images - now saucier with indexedDB
 * Modifies the storage approach of the CacheImages to utilize indexedDB for storage
 *
 * Official jQuery plugin page: 
 * Find source on GitHub: https://github.com/FreshVine/jQuery-cache-image
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB; // Unify browser prefixes to maintain sanity
	$.fn.cacheImages.defaults.ready = false;	// Ensure that we are ready to do check for a db connection to be active
	if( $.fn.cacheImages.defaults.debug ){ console.log('cacheImages will use indexedDB '); }

	/* -- Setup everything we need for the database -- */
	if( typeof $.fn.cacheImages.defaults.indexedDbName === 'undefined' ){ $.fn.cacheImages.defaults.indexedDbName = 'cacheImages'; }	// Needs to be defined prior to instantiating this script - but after including the primary cacheImages script
	$.fn.cacheImages.dbRequest = window.indexedDB.open( $.fn.cacheImages.defaults.indexedDbName, 1 );
	var cacheImagesDb;	// used to hold the db reference
	$.fn.cacheImages.defaults.indexedDbStatus = false;

	// Enable
	$.fn.cacheImages.dbRequest.onerror = function(e) {
		$.fn.cacheImages.defaults.indexedDbStatus = false;
		if( $.fn.cacheImages.defaults.debug ){ console.log("Why didn't you allow my web app to use IndexedDB?!"); };
	};
	$.fn.cacheImages.dbRequest.onsuccess = function(e) {
		if( $.fn.cacheImages.defaults.debug ){ console.log("IndexedDB open success. It is ready"); };
		$.fn.cacheImages.defaults.ready = $.fn.cacheImages.defaults.indexedDbStatus = true;
		window.cacheImagesDb = e.target.result;

		window.cacheImagesDb.onerror = function(e) {
		  if( $.fn.cacheImages.defaults.debug ){ console.log("IndexedDB error: " + e.target.errorCode); };
		};
	};
	//handle setup
	$.fn.cacheImages.dbRequest.onupgradeneeded = function(e) {
		if( $.fn.cacheImages.defaults.debug ){ console.log("running onupgradeneeded"); }
		var thisDb = e.target.result;

		//Create Note
		if(!thisDb.objectStoreNames.contains("offlineImages")) {
			// Structure is key, image
			console.log("making the offlineImages objectstore");
			var objectStore = thisDb.createObjectStore("offlineImages", { keyPath: "key" });
		    var titleIndex = objectStore.createIndex("by_key", "key", {unique: true});
		}
	};
	/* -- Setup everything we need for the database -- */


	/*
	 *	Check if the client has this storage method available
	 */
	$.fn.cacheImages.storageAvailable = function( thisElem, i, img, callbackFunction ){
		if( $.fn.cacheImages.defaults.debug ){ console.log('indexedDB availability check'); }

		if( $.fn.cacheImages.defaults.indexedDbStatus === true ){
	        callbackFunction.call( thisElem, i, img );	// This is the structure to use for our callbacks
			return;
		}

		var intervalCount = 0,
			thisInterval = setInterval(function(){
				intervalCount++;
				if( $.fn.cacheImages.defaults.indexedDbStatus === true ){
					if( $.fn.cacheImages.defaults.debug ){ console.log('indexedDB ready to use'); }
			        callbackFunction.call( thisElem, i, img );	// This is the structure to use for our callbacks
					clearInterval(thisInterval); return;
				}
				if( intervalCount >= 41 ){ if( $.fn.cacheImages.defaults.debug ){ console.log('indexedDB did not load'); } clearInterval(thisInterval); return;	}	// only run for 2 seconds max

				if( $.fn.cacheImages.defaults.debug ){ console.log('indexedDB not yet available'); }
			}, 50 );

		// if( $.fn.cacheImages.defaults.ready === false ){}
		// setTimeout(function(){ return 10; }, 1500);
		return $.fn.cacheImages.defaults.indexedDbStatus;
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
		};
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
			if( typeof e.target.result !== 'undefined' && typeof e.target.result.image === 'string' ){ encodedString = e.target.result.image; }

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
	$.fn.cacheImages.Output = function( url, storagePrefix, callbackFunction ){
		if( typeof storagePrefix === 'undefined' || typeof storagePrefix === 'null' ){ storagePrefix = $.fn.cacheImages.defaults.storagePrefix; }
		var tempKey = storagePrefix + ':' + url,
			thisElem = this;

		var request = window.cacheImagesDb.transaction("offlineImages", "readonly").objectStore("offlineImages").get( tempKey );
		request.onsuccess = function(e) {
			var image = '';
			if( typeof e.target.result !== 'undefined' && typeof e.target.result.image === 'string' && /^data:image/.test( e.target.result.image ) === true ){
				image = e.target.result.image;
			}

			if( image == '' ){
				if( /^data:image/.test( $.fn.cacheImages.defaults.defaultImage ) === true ){
					image = $.fn.cacheImages.defaults.defaultImage;	// this is an encoded string
				}else{
					tempKey = storagePrefix + ':' + this.cacheImagesConfig.defaultImage;
					if( window.localStorage.getItem( tempKey ) != null ){
						return window.localStorage.getItem( tempKey );	// Default URL was already cached
					}
				}
			}

	        if( typeof callbackFunction === 'function' ){
	            callbackFunction.call( thisElem, image );	// This is the structure to use for our callbacks
	        }
		}


		// if( window.localStorage.getItem( tempKey ) != null ){
		// 	return window.localStorage.getItem( tempKey );	// Image exists in the cache
		// }else{
		//
		// 	if( /^data:image/.test( $.fn.cacheImages.defaults.defaultImage ) === true ){
		// 		return this.cacheImagesConfig.defaultImage;	// this is an encoded string
		// 	}
		//
		// 	tempKey = storagePrefix + ':' + this.cacheImagesConfig.defaultImage;
		// 	if( window.localStorage.getItem( tempKey ) != null ){
		// 		return window.localStorage.getItem( tempKey );	// Default URL was already cached
		// 	}
		// }

		return null;	// Neither the image or the cached version existsed
	};
	/*
	 *	Will remove all of the cached images from their localStorage
	 */
	$.fn.cacheImages.drop = function( storagePrefix ){
		var dropKeys = [],	// Store the keys we need to drop here
			debug = true;
		if( typeof storagePrefix === 'undefined' ){ storagePrefix = $.fn.cacheImages.defaults.storagePrefix; }

		var request = window.cacheImagesDb.transaction("offlineImages", "readonly").objectStore("offlineImages").openCursor();
		request.onsuccess = function(e) {
			var cursor = e.target.result;
			if (cursor) {
				// Called for each matching record.
				if( cursor.value.key.substr( 0,storagePrefix.length + 1 ) === storagePrefix + ':' ){	// Does not match our prefix?
					dropKeys.push(cursor.value.key ); // Droping the keys here re-indexes the localStorage so that the offset in our loop is wrong
				}
				cursor.continue();
			}else{
				// No more matching records.
				console.log('No more matching records');

				if( dropKeys.length ===  0 ){
					if( debug ){ console.log( 'No Images to Drop' ); }
					return true;
				}

				// Drop the keys we found
				for( i = 0; i < dropKeys.length; i++ ){
					if( debug ){ console.log( 'Dropping localStorage Key:', dropKeys[i] ); }	// Let them know what keys were dropped
					window.cacheImagesDb.transaction("offlineImages", "readwrite").objectStore("offlineImages").delete( dropKeys[i] );
				}

				if( debug ){ console.log( 'Dropped ' + dropKeys.length + ' images from indexedDB' ); }	// Provide a bit of feedback for developers
				return true;
			}
		};
	};
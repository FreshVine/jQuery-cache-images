#jQuery Cache Images plugin  
  
Plugin for jQuery that allows for the easy caching of image files in the browsers localStorage. The local storage approach allows the media to persist across sessions, while the browser manages all of the cross-domain privacy protections.  
  
## Using the Plugin  
The plugin can be used two ways. It can either be applied to a specific element in the DOM, or you can apply it to a container that will have images within it (coming soon). The plugin runs asynchronously as it fetches, processes and stores the images locally. You can write alternate storage approaches by mimicing the jquery.cacheImages.indexeddb.js script. Or if you are looking to use IndexedDB you can just load that script after the cacheImages.js script and before you invoke cacheImages(). Using localStorage will be faster, but is limited to browser restrictions with a qouta of about 5mb. IndexedDB will have a significantly larger qouta (the exact amount depends upon the client).
  
**Options**  
Each of these is optional. You can set them in the function call (locally), or set them globally.  
```
$('img').cacheImages({debug: true;})	// Locally Set
$.fn.cacheImages.defaults.debug = true;	// Globally Set
```

* *always*: callback that is last to run, and runs for every call  
* *debug*: Enables a lot of console messaging to help you troubleshoot [default: false]  
* *defaultImage*: URL or base64 string for the default image (will obviously get cached) - default is at assets/default.jpg  
* *done*: callback when the cache was successfully fetched or placed  
* *encodeOnCanvas*: Experimental use of the HTML5 canvas element to encode the images | Not recommended for production [default: false]  
* *fail*: callback when the caching is not possible (unable to reach the file, or unable to cache file)
* *storagePrefix*: Used to prefix the URL in the localStorage key	[default: 'cached']  
* *url*: Set the image URL to be cached for the selector [default: null]  
* *forceSave*: Will force the call to cache to save the current URL even if media from that URL has already been cached. [default: false] **Don't set Globally** 
  
### Attaching to an Element  
`$('img#AnElement').cacheImages();`  
Any selector here works, however it will bind to only existing elements. If you need to have the caching work on future dynamically created elements use the second approach.

### *Attached to a Parent Container  **Coming Soon***
`$('div#AwesomeContainer').cacheImages();`  
  
This will watch for changes to the parent and all child elements for changes that involve images. The plugin will step in, cache the image into local storage, and reveil the image to the user.
  
### Dynamically Adding an Element  
`$('img').cacheImages({url: 'http://upload.wikimedia.org/wikipedia/commons/1/1d/Fishfinger1.jpg'};`  
  
Allows you to easily drop caching into your dom additions. It will look at the cached files, and if none exist, it will insert the default image, and attempt to fetch the specified image.  

### Manually caching an image  
`$.fn.cacheImages.fetchURL('http://upload.wikimedia.org/wikipedia/commons/9/92/Muraltmuur.jpg');`  
  
Attempts to cache that image into your clients browser local storage. This can be very helpful if you have an app where you are storying data into webSQL or IndexedDB and want to grab images during an initial sync, but those images might not be needed until later. By caching the images early you ensure that they would be available along with the other data.  
  
These images would later be automatically placed due to element or parent binding, or you could manually place them (see below).

### Manually retrieving an image
`$.fn.cacheImages.Output('http://upload.wikimedia.org/wikipedia/commons/9/92/Muraltmuur.jpg', function(image){ console.log('From Cache: ' + image); }, 'OptionalPrefix' );`  
  
If you need to use an image in your inline css, or in another context where you just need the encoded string you should use this function. It will return the encoded string if it has already been cached, or it will return the default (if that is already encoded), or null. This will not fetch the URL.

### Drop the cached images  
`$.fn.cacheImages.drop( *url*, *storagePrefix* );`  
`$.fn.cacheImages.drop();	// Drop all images`  
`$.fn.cacheImages.drop('http://upload.wikimedia.org/wikipedia/commons/1/1d/Fishfinger1.jpg');	//Drop a specific image` 
`$.fn.cacheImages.drop(null, 'cachedImages');	//Drop a set of images` 
  
Helpful to clean up stored images from the cache without dropping everything stored. You can optionally set a *url*, and/or *storagePrefix* in the function to only drop specific image, or set of images.  
  
## indexDB and callbacks  
One of the major differences between localstorage and indexDB is that the queries to the database happen out of the functional flow of your script. This means you must use callbacks to excecute scripts with the outcome, or after the conclusion of the previous script. Not using callbacks can result in weird behavior.
  
# Credits and Thanks  
* Based Heavily off of @doomhz plugin [jQueryImageCache](https://github.com/doomhz/jQuery-Image-Cache)
* Utilizing base64 encoding from @mathias [Encoding XHR image data](http://jsperf.com/encoding-xhr-image-data/33)

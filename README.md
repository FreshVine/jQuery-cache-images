#jQuery Cache Images plugin  
  
Plugin for jQuery that allows for the easy caching of image files in the browsers localStorage. The local storage approach allows the media to persist across sessions, while the browser manages all of the cross-domain privacy protections.  
  
## Using the Plugin  
The plugin can be used two ways. It can either be applied to a specific element in the DOM, or you can apply it to a container that will have images within it. Both approached will bind the Cache Image plugin to all future changes that occur to those elements or their children.  
  
**Options**  
Each of these is optional.  

* *debug*: Enables a lot of console messaging to help you troubleshoot [default: false]  
* *defaultImage*: URL or base64 string for the default image (will obviously get cached) - default is at assets/default.jpg  
* *encodeOnCanvas*: Experimental use of the HTML5 canvas element to encode the images | Not recommended for production [default: false]  
* *storagePrefix*: Used to prefix the URL in the localStorage key	[default: 'cached']  
* *url*: Set the image URL to be cached for the selector [default: null]  
  
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
`cacheImagesFetchURL('http://upload.wikimedia.org/wikipedia/commons/9/92/Muraltmuur.jpg');`  
  
Attempts to cache that image into your clients browser local storage. This can be very helpful if you have an app where you are storying data into webSQL or IndexedDB and want to grab images during an initial sync, but those images might not be needed until later. By caching the images early you ensure that they would be available along with the other data.  
  
These images would later be automatically placed due to element or parent binding, or you could manually place them (see below).

### Manually retrieving an image
`cacheImagesOutput('http://upload.wikimedia.org/wikipedia/commons/9/92/Muraltmuur.jpg');`  
  
If you need to use an image in your inline css, or in another context where you just need the encoded string you should use this function. It will return the encoded string if it has already been cached, or it will return the default (if that is already encoded), or null. This will not fetch the URL since that is an asynchronous event that cannot return your output.


# Credits and Thanks  
* Based Heavily off of @doomhz plugin [jQueryImageCache](https://github.com/doomhz/jQuery-Image-Cache)
* Utilizing base64 encoding from @mathias [Encoding XHR image data](http://jsperf.com/encoding-xhr-image-data/33)

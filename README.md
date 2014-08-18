jQuery Cache Image plugin
==================

Plugin for jQuery that allows for the easy caching of image files in the browsers localstorage. The local storage approach allows the media to persist across sessions, while the browser manages all of the cross-domain privacy protections.  
  
## Using the Plugin  
The plugin can be used two ways. It can either be applied to a specific element in the DOM, or you can apply it to a container that will have images within it. Both approached will bind the Cache Image plugin to all future changes that occur to those elements or their children.  
  
### Attaching to an Element
`$('img#AnElement').cacheImage();`  
Any selector here works, however it will bind to only existing elements. If you need to have the caching work on future dynamically created elements use the second approach.

### Attached to a Parent Container
`$('div#AwesomeContainer').cacheImage();`
This will watch for changes to the parent and all child elements for changes that involve images. The plugin will step in, cache the image into local storage, and reveil the image to the user.

### Manually caching an image
`cacheImageFetchURL('http://yourenota.plumber/wear-a-belt.png');`  
Attempts to cache that image into your clients browser local storage. This can be very helpful if you have an app where you are storying data into webSQL or IndexedDB and want to grab images during an initial sync, but those images might not be needed until later. By caching the images earily you ensure that they would be available along with the other data.  
  
These images would later be automatically placed due to element or parent binding, or you could manually place them (see below).

## Configuring the plugin  
There are no required configuration steps for the plugin to work (aside from actually calling the function at least once). You are able to 
 
## Future Goals  
I would love to see this also apply to background images. Currently you can manually cache the image, and the manually display the image into your css. It would look like the following.  
  
1. Caching the Image if used before hand  
1. Use the place image function

```
cacheImageFetchURL('http://lookatmy.diamonds/mega-stone.jpg');  // Use to pre-cache earlier
cacheImageDisplay('http://lookatmy.diamonds/mega-stone.jpg');   // Use to insert the base64 encoded image string
```

# Credits and Thanks
  
* Based Heavily off of @doomhz plugin [jQueryImageCache](https://github.com/doomhz/jQuery-Image-Cache)
* Utilizing base64 encoding from @mathias [Encoding XHR image data](http://jsperf.com/encoding-xhr-image-data/33)

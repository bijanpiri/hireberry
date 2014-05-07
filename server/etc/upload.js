/**
 * Created by Bijan on 04/29/2014.
 */
upload = require('jquery-file-upload-middleware'); // Don't Forget Creating /public/tmp and /public/uploads

// configure upload middleware
upload.configure({
    tmpDir: __dirname + '/../public/tmp',
    uploadDir: __dirname + '/../public/uploads',
    uploadUrl: '/../flyer/upload',
    imageVersions: {
        thumbnail: {
            width: 80,
            height: 80
        }
    }
});

upload.on('begin', function (fileInfo) {
    // fileInfo structure is the same as returned to browser
    // {
    //     name: '3 (3).jpg',
    //     originalName: '3.jpg',
    //     size: 79262,
    //     type: 'image/jpeg',
    //     delete_type: 'DELETE',
    //     delete_url: 'http://yourhost/upload/3%20(3).jpg',
    //     url: 'http://yourhost/uploads/3%20(3).jpg',
    //     thumbnail_url: 'http://youhost/uploads/thumbnail/3%20(3).jpg'
    // }

    fileInfo.name = crypto.randomBytes(12).readUInt32LE(0) + fileInfo.name.substr(fileInfo.name.lastIndexOf('.'));
    console.log(fileInfo);
});
upload.on('abort', function (fileInfo) { });
upload.on('end', function (fileInfo) { });
upload.on('delete', function (fileInfo) {  });
upload.on('error', function (e) {
    console.log(e.message);
});


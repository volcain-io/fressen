/*
 Run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/

module.exports = grunt => {
  grunt.initConfig({
    responsive_images: {
      dev: {
        options: {
          engine: 'im',
          sizes: [
            {
              width: 800,
              height: 600,
              name: 'medium',
              suffix: '_2x',
              quality: 50,
              gravity: 'Center',
              aspectRatio: false
            },
            {
              width: 400,
              height: 300,
              name: 'medium',
              suffix: '_1x',
              quality: 50,
              gravity: 'Center',
              aspectRatio: false
            },
            {
              width: 512,
              height: 304,
              name: 'small',
              suffix: '_2x',
              quality: 40,
              gravity: 'Center',
              aspectRatio: false
            },
            {
              width: 256,
              height: 152,
              name: 'small',
              suffix: '_1x',
              quality: 50,
              gravity: 'Center',
              aspectRatio: false
            }
          ]
        },
        files: [
          {
            expand: true,
            src: ['*.{gif,jpg,png}'],
            cwd: 'img/',
            dest: 'images/'
          }
        ]
      }
    },

    /* Clear out the images directory if it exists */
    clean: {
      dev: {
        src: ['images']
      }
    },

    /* Generate the images directory if it is missing */
    mkdir: {
      dev: {
        options: {
          create: ['images']
        }
      }
    },

    /* Copy the "fixed" images that don't go through processing into the images/directory */
    copy: {
      dev: {
        files: [
          {
            expand: true,
            flatten: true,
            src: 'img/fixed/*.{gif,jpg,png,svg}',
            dest: 'images/fixed/'
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-responsive-images');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-mkdir');
  grunt.registerTask('default', ['clean', 'mkdir', 'copy', 'responsive_images']);
};

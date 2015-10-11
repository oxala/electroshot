var fs = require('fs'),
    path = require('path'),
    crypto = require('crypto'),
    assert = require('assert'),
    spawn = require('child_process').spawn;

var fixture = require('file-fixture');
var binpath = path.normalize(__dirname + '/../bin/shot.js');

function md5(filename) {
  var hash = crypto.createHash('md5');
  hash.update(fs.readFileSync(filename));
  return hash.digest('hex');
}

function run(args, cwd, onDone) {
  console.log(binpath + ' ' + args.join(' '));
  var child = spawn(binpath, args, {
        cwd: cwd,
        maxBuffer: 1024 * 1024
      });
  var stdout = '';
  child.stdout.on('data', function(data) {
    stdout += data.toString();
  });
  var stderr = '';
  child.stderr.on('data', function(data) {
    stderr += data.toString();
  });
  child.on('error', function(err) {
    throw err;
  });

  child.on('close', function(code) {
      var json;
      if (stderr) {
        console.log('stderr: ' + stderr);
      }
      if (code !== 0) {
        throw new Error('Child exit code: ' + code);
      }
      console.log(stdout);
      onDone(stdout);
  });
}

describe('integration tests', function() {

  it('can delay for a specific interval', function(done) {
    this.timeout(5000);
    var tmpDir = fixture.dirname();
    run([__dirname + '/fixtures/interval.html', '100x100', '--out', tmpDir, '--delay', '1000' ], process.cwd(), function() {
      assert.equal(md5(tmpDir + '/interval-100x100.png'), '46ead2a024bd27574d6ba36f0b47d793');
      done();
    });
  });

  it('can screenshot a specific element', function(done) {
    this.timeout(10000);
    var tmpDir = fixture.dirname();
    run([__dirname + '/fixtures/selector.html', '100x100', '--out', tmpDir, '--selector', '#one' ], process.cwd(), function() {
      assert.equal(md5(tmpDir + '/selector-100x100.png'), '2f4358ac1b145b71c984abc40a3306f3');
      run([__dirname + '/fixtures/selector.html', '100x100', '--out', tmpDir, '--selector', '.two' ], process.cwd(), function() {
        assert.equal(md5(tmpDir + '/selector-100x100.png'), 'd66cec58520cb2b391354b08c0e802c8');
        done();
      });
    });
  });

  it('can set a zoom factor', function(done) {
    this.timeout(10000);
    var tmpDir = fixture.dirname();
    run([
      '[',
        __dirname + '/fixtures/selector.html',
        '100x100',
        '--zoom-factor', '3',
      ']',
      '[',
        __dirname + '/fixtures/selector.html',
        '100x100',
        '--zoom-factor', '1',
      ']',
      '--out', tmpDir,
       ], process.cwd(), function() {
        assert.ok([
            '21d28dbf925e0a0152ff4d2785733f30', // OSX
            'bb4ab9d772fd6d9ab92ee8c4646c3df1', // Ubuntu
          ].indexOf(md5(tmpDir + '/selector-100x100-1.png')) !== -1
        );
        assert.ok([
            'bae69b8086212675c19dfdbba2c84eeb', // OSX
          ].indexOf(md5(tmpDir + '/selector-100x100-2.png')) !== -1
        );
        done();
    });
  });

  it('can set a Chrome flag', function(done) {
    this.timeout(5000);
    var tmpDir = fixture.dirname();
    run([__dirname + '/fixtures/selector.html', '100x100', '--out', tmpDir, '--force-device-scale-factor', 2], process.cwd(), function() {
      assert.equal(md5(tmpDir + '/selector-100x100.png'), 'bae69b8086212675c19dfdbba2c84eeb');
      done();
    });
  });

  it('can produce a jpg image', function(done) {
    this.timeout(5000);
    var tmpDir = fixture.dirname();
    run([__dirname + '/fixtures/selector.html', '100x100', '--out', tmpDir, '--format', 'jpg', '--quality', '85'], process.cwd(), function() {
      // console.log(tmpDir);
      assert.equal(md5(tmpDir + '/selector-100x100.jpg'), 'd23a7483bfc2010d8ac15793620b98d4');
      done();
    });
  });

  describe('errors', function() {

    it('warns when called with no params', function() {

    });

    it('warns when no url is passed', function() {

    });

    it('warns when width is undefined', function() {

    });

    // errors:
    // - no url
    // - width is undefined
    // - remove temporary files on error (any error)
    // - 404 error on URL
    // - redirects
    // - SSL errors
    // - page.onError handler
    // - cannot exec
    // - page is very wide or very tall
    // - EADDRINUSE

  });

});

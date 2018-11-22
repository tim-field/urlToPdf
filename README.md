## Use headless Chrome to generate PDF's ##

Note, this is rather specific to a use case I have and not designed for public consumption. Should probably be used as more of a guide than a dependency in your own project. 
However I'm happy for pull requests that make it more configurable. 

### Setup ###
```
sudo apt-get install libxss1 libappindicator1 libindicator7
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome*.deb  # Might show "errors", fixed by next line
sudo apt-get install -f
```

## Developing on Mac

* On Mac, the chrome executable is not called `google-chrome`, so before running server.js
  run the following command from the root of this repo

```
source env_mac
```

* To start the server run `node server.js`

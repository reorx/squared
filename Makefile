.PHONY: clean test

clean:
	rm -rf build dist *.egg-info

run:
	PYTHONPATH=. python squared/app.py

pack:
	tar -C .. -czvf /tmp/squared.tar.gz --exclude "./squared/.git" --exclude "./squared/node_modules" squared

deploy:
	scp /tmp/squared.tar.gz reorx-dev0:/home/reorx
	ssh reorx-dev0 "tar xzf squared.tar.gz"

.PHONY: clean test

host := $$(cat .deployhost)

clean:
	rm -rf build dist *.egg-info

run:
	PYTHONPATH=. python squared/app.py

deploy:
	@echo "\n# Sync files"
	rsync -avr --exclude-from=rsync_excludes.txt --delete --delete-excluded . $(host):/tmp/squared
	@echo "\n# Restart service"
	ssh $(host) "cd supervisor && supervisorctl restart squared"

.PHONY: clean test

clean:
	rm -rf build dist *.egg-info

run:
	PYTHONPATH=. python squared/app.py

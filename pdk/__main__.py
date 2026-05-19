"""Allow `python -m pdk` to behave like the `pdk` console script."""

from pdk.cli import main

if __name__ == "__main__":
    main()

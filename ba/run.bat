@echo off
py -m uvicorn main:app --host :: --port 4445 --reload

# Fixture: container images. (Dockerfiles have no trailing comments; markers are for the test only.)
FROM python:3.12-bookworm AS build # expect: docker-old-tls-stack
RUN apt-get update && apt-get install -y openssl=3.0.15-1~deb12u1 # expect: docker-apt-old-openssl
FROM golang:1.22 AS go # expect: docker-old-tls-stack
FROM node:24-alpine AS web
FROM debian:trixie-slim

require 'sinatra'
require 'sinatra/content_for'
require 'haml'
require 'aws-sdk-core'

get '/buildjson/?' do
  render :build
end

get '/upload/?' do
  render :upload
end

get '/*.*' do
  send_file File.join(settings.public_folder, params[:splat].join("."))
end

get '/' do
  haml :index
end

configure do
  Aws.config = {
    access_key_id: ENV['AWS_ACCESS_KEY'],
    secret_access_key: ENV['AWS_SECRET_KEY'],
    region: "us-east-1"
  }
  set s3: Aws.s3
end

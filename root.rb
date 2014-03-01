require 'sinatra'
require 'sinatra/content_for'
require 'haml'
require 'json'
require 'aws-sdk-core'
require './aws.rb'

get '/api/bucket/?' do
  JSON.dump(AwsConnection.get_buckets)
end

get '/api/bucket/:bucket/?' do
  JSON.dump(AwsConnection.get_images(params[:bucket]))
end

post '/api/upload/?' do

end

get '/buildjson/?' do
  buckets = settings.s3.list_buckets.buckets
  haml :build, locals: {buckets: buckets}
end

get '/upload/?' do
  haml :upload
end

get '/*.*' do
  send_file File.join(settings.public_folder, params[:splat].join("."))
end

get '/' do
  haml :index
end

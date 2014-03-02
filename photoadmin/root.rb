require 'sinatra'
require 'sinatra/content_for'
require 'haml'
require 'json'
require 'aws-sdk-core'
require './aws.rb'

helpers do
  def four_oh_four bucket
    halt 404, {"Content-Type" => "text/json"}, <<-JSON
    {
      "status": 404,
      "error": "Bucket #{bucket} not found."
    }
    JSON
  end
end

get '/api/bucket/?' do
  JSON.dump(AwsConnection.get_buckets)
end

get '/api/bucket/:bucket' do
  bucket = params[:bucket]
  four_oh_four(bucket) unless bucket.start_with? "pw-"
  begin
    JSON.dump(AwsConnection.get_images(bucket))
  rescue Aws::S3::Errors::NoSuchBucket
    four_oh_four(bucket)
  rescue Aws::S3::Errors::AccessDenied
    four_oh_four(bucket)
  end
end

get '/api/saved/?' do
  JSON.dump(AwsConnection.get_saved_walls)
end

post '/api/save/?' do
  # save json blob to s3 bucket 'photo-wall-static'
  halt 400
end

post '/api/upload/?' do
  halt 400
end

get '/buildjson/?' do
  buckets = AwsConnection.get_buckets
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

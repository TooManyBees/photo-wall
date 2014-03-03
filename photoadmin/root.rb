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

  def try_s3 &blk
    begin
      yield blk
    rescue Aws::S3::Errors::NoSuchBucket
      four_oh_four bucket
    rescue Aws::S3::Errors::AccessDenied
      four_oh_four bucket
    end
  end
end

before '/api/' do
  four_oh_four unless bucket.start_with? "pw-"
end

get '/api/bucket/?' do
  JSON.dump(AwsConnection.get_buckets)
end

get '/api/bucket/:bucket' do
  bucket = params[:bucket]
  try_s3 { JSON.dump(AwsConnection.get_images(bucket)) }
end

get '/api/saved/:bucket?' do
  bucket = params[:bucket]
  resp = try_s3 { JSON.dump(AwsConnection.get_saved_walls(bucket)) }
  status 201
  resp
end

post '/api/save/:bucket/?' do
  bucket = params[:bucket]
  try_s3 { JSON.dump(AwsConnection.save_json(bucket, params[:json])) }
end

post '/api/upload/:bucket/?' do
  halt 400
end

get '/buildjson/?' do
  buckets = AwsConnection.get_buckets
  haml :build, locals: {buckets: buckets}
end

get '/upload/?' do
  haml :upload
end

get '/test/?' do
  haml :index, locals: {remote_json: params[:src]}
end

get '/*.*' do
  send_file File.join(settings.public_folder, params[:splat].join("."))
end

get '/' do
  haml :index, locals: {remote_json: 'kitty.json'}
end

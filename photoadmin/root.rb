require 'sinatra'
require 'sinatra/content_for'
require 'haml'
require 'json'
require 'aws-sdk-core'
require './aws.rb'

get '/api/buckets/?' do
  JSON.dump(AwsConnection.get_buckets)
end

get '/api/buckets/:bucket' do
  bucket = params[:bucket]
  try_s3 { JSON.dump(AwsConnection.get_images(bucket)) }
end

get '/api/buckets/:bucket/saved' do
  bucket = params[:bucket]
  try_s3 { JSON.dump(AwsConnection.get_saved_walls(bucket)) }
end

post '/api/buckets/:bucket' do
  begin
    bucket = params[:bucket]
    AwsConnection.create_bucket(bucket)
  rescue Aws::S3::Errors::BucketAlreadyExists
    four_twenty_two bucket
  end
end

put '/api/buckets/:bucket' do
  # one-by-one upload to aws and return location
  halt 400
end

post '/api/save/:bucket/?' do
  bucket = params[:bucket]
  try_s3 { JSON.dump(AwsConnection.save_json(bucket, params[:json])) }
end

get '/walls/?' do
  buckets = AwsConnection.get_buckets
  buckets.map! do |bucket|
    walls = AwsConnection.get_saved_walls(bucket)
    {name: bucket, walls: walls}
  end
  haml :walls, locals: {buckets: buckets}
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

helpers do
  def four_oh_four bucket
    halt 404, {"Content-Type" => "text/json"}, <<-JSON
{
  "status": 404,
  "error": "Bucket #{bucket} not found."
}
    JSON
  end

  def four_twenty_two bucket
    halt 422, {'Content-Type' => 'text/json'}, <<-JSON
{
  "status": 422,
  "error": "The bucket #{bucket} already exists."
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

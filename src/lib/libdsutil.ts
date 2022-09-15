/**
 * Helper class with useful function to operate a VDC
 */
import * as findFreePort from 'find-free-port';

/**
 * Generates a 34 byte dSUID
 * @returns dSUID
 */
export function getDSUID() {
  const genRanHex = (size: number) =>
    [...Array(size)]
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');
  return genRanHex(34);
}

/**
 * Searches for free ports between 40000 and 50000 to use as the port for the VDC
 * @async
 * @returns port
 */
export async function getFreePort(): Promise<number> {
  const getFP = async function () {
    let result = await findFreePort(40000, 50000)
      .then((freep: number) => {
        return freep;
      })
      .catch((err: string) => {
        console.error(err);
        return err;
      });
    return await result;
  };
  let port: any;
  port = await getFP();
  console.log(port);
  return port[0];
}

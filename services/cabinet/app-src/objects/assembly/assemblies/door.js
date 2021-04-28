
class Door extends Assembly {
  constructor(partCode, partName, door, ) {
    super(partCode, partName);
    this.pull =

    this.updatePull = () => {
      pulls.push(new Pull(`dp`, 'Door.Pull', instance.doorPullCenter, instance.pullDems, 'z'));
    }
  }
}
